import cron from "node-cron";
import pool from "../config/db.js";
import { enviarMensajeWhatsApp, getEstadoWhatsApp, getUsuariosConectados, sistemaDisponible, SISTEMA_ID } from "../services/whatsapp.js";

const DIAS_ES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function formatearFecha(fecha) {
  // Usar T12:00:00-03:00 para fijar zona horaria Argentina y evitar desfase de día
  const d = new Date(fecha + "T12:00:00-03:00");
  return `${DIAS_ES[d.getUTCDay()]} ${d.getUTCDate()} de ${MESES_ES[d.getUTCMonth()]}`;
}

function formatearHora(hora) {
  return hora ? hora.substring(0, 5) : "";
}

function reemplazarVariables(texto, variables) {
  let result = texto;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }
  return result;
}

// Procesa los recordatorios de UN usuario puntual (su propia config, sus propios
// turnos, su propio socket de WhatsApp). Aislado por completo de otros usuarios:
// nada se comparte, así que no hay forma de que un envío termine cruzándose
// con el número de otra cuenta.
export async function ejecutarJob({ usuarioId, forzar = false, soloPacientes = true, soloProf = true } = {}) {
  if (!usuarioId) {
    console.warn("[Recordatorios] ejecutarJob requiere usuarioId — abortando.");
    return { enviados: 0, turnos: 0, waConectado: false, mensaje: "usuarioId requerido" };
  }

  console.log(`[Recordatorios:${usuarioId}] Verificando turnos para mañana...`);

  const waEstado = getEstadoWhatsApp(usuarioId);
  if (!waEstado.conectado) {
    console.warn(`[Recordatorios:${usuarioId}] WhatsApp no conectado (estado: ${waEstado.estado}). Abortando.`);
    return { enviados: 0, turnos: 0, waConectado: false, mensaje: `WhatsApp no conectado (${waEstado.estado})` };
  }

  try {
    const configResult = await pool.query(
      "SELECT * FROM configuracion_notificaciones WHERE usuario_id = $1 LIMIT 1",
      [usuarioId]
    );

    const config = configResult.rows[0] || {};
    console.log(`[Recordatorios:${usuarioId}] Config: notif_pacientes=${config.notificaciones_pacientes}, notif_profesional=${config.notificaciones_profesional}, tel=${config.telefono_profesional}`);

    const notificacionesPacientes = soloPacientes && (forzar || config.notificaciones_pacientes !== false);
    const notificacionesProfesional = soloProf && (forzar || config.notificaciones_profesional !== false);
    // Destino del resumen: el número del profesional. Si está disponible el número
    // central del sistema, el resumen se ENVÍA desde ese número (distinto del profe)
    // → suena. Si no, cae al envío por el propio número del profe (no suena, pero
    // conserva el comportamiento previo). telefono_resumen sigue funcionando como
    // override opcional del destino (por si quiere recibirlo en otro celular).
    const telefonoProfesional = (config.telefono_resumen || config.telefono_profesional || "").trim();
    const mensajePacienteTexto = config.mensaje_paciente ||
`👋 ¡Hola {nombre}!

Te recordamos que tenés turno *mañana {fecha}* a las *{hora} hs* en _{consultorio}_.

Ante cualquier cambio, comunicate con nosotros.
¡Te esperamos! 😊`;

    const mensajeProfesionalTexto = (config.mensaje_profesional ||
`📅 *Agenda del {fecha}*

Tenés *{cantidad} turno(s)* programado(s):

{lista_turnos}

¡Que tengas un excelente día! ✨`).replace(/\\n/g, '\n');

    const turnosResult = await pool.query(`
      SELECT t.*, p.nombre, p.apellido, p.telefono
      FROM turnos t
      JOIN pacientes p ON t.paciente_id = p.id
      WHERE t.usuario_id = $1
        AND t.fecha = (CURRENT_TIMESTAMP AT TIME ZONE 'America/Argentina/Buenos_Aires')::date + INTERVAL '1 day'
        AND t.estado IN ('pendiente', 'confirmado')
        AND p.telefono IS NOT NULL
        AND p.telefono != ''
    `, [usuarioId]);

    const turnos = turnosResult.rows;
    console.log(`[Recordatorios:${usuarioId}] Turnos encontrados para mañana: ${turnos.length}`);

    if (turnos.length === 0) {
      return { enviados: 0, turnos: 0, waConectado: true, mensaje: "No hay turnos para mañana" };
    }

    let enviados = 0;

    // ─── Recordatorios a pacientes ───
    if (notificacionesPacientes) {
      for (const turno of turnos) {
        const yaEnviado = await pool.query(
          `SELECT id FROM notificaciones WHERE turno_id = $1 AND tipo = 'recordatorio_turno' AND estado = 'enviado' AND DATE(enviado_en AT TIME ZONE 'America/Argentina/Buenos_Aires') = (CURRENT_TIMESTAMP AT TIME ZONE 'America/Argentina/Buenos_Aires')::date`,
          [turno.id]
        );
        if (yaEnviado.rows.length > 0) {
          console.log(`[Recordatorios:${usuarioId}] Ya enviado exitosamente hoy para turno ${turno.id} (${turno.nombre} ${turno.apellido})`);
          continue;
        }

        const fechaTurnoStr = turno.fecha instanceof Date
          ? turno.fecha.toISOString().substring(0, 10)
          : String(turno.fecha).substring(0, 10);

        const mensaje = reemplazarVariables(mensajePacienteTexto, {
          nombre: turno.nombre,
          fecha: formatearFecha(fechaTurnoStr),
          hora: formatearHora(turno.hora),
          consultorio: turno.consultorio || "el consultorio",
        });

        // onResult se dispara cuando el mensaje se ENTREGA de verdad (o se descarta
        // definitivamente), no al encolarlo. Recién ahí registramos 'enviado'/'error'.
        // Esto evita el bug por el que un mensaje encolado-pero-nunca-entregado quedaba
        // marcado como 'enviado' y nunca se reintentaba → "solo llegaban algunos".
        const registrarResultado = async ({ ok, error }) => {
          if (ok) {
            await pool.query(
              `INSERT INTO notificaciones (turno_id, paciente_id, telefono, mensaje, tipo, estado) VALUES ($1, $2, $3, $4, 'recordatorio_turno', 'enviado')`,
              [turno.id, turno.paciente_id, turno.telefono, mensaje]
            );
            console.log(`[Recordatorios:${usuarioId}] ✓ Entregado a ${turno.nombre} ${turno.apellido} (${turno.telefono})`);
          } else {
            await pool.query(
              `INSERT INTO notificaciones (turno_id, paciente_id, telefono, mensaje, tipo, estado, error_detalle) VALUES ($1, $2, $3, $4, 'recordatorio_turno', 'error', $5)`,
              [turno.id, turno.paciente_id, turno.telefono, mensaje, error || "Fallo de entrega"]
            );
            console.warn(`[Recordatorios:${usuarioId}] ✗ Falló entrega a ${turno.nombre} ${turno.apellido} (${turno.telefono}): ${error}`);
          }
        };

        try {
          const envioResult = await enviarMensajeWhatsApp({
            usuarioId,
            telefono: turno.telefono,
            mensaje,
            onResult: registrarResultado,
          });
          console.log(`[Recordatorios:${usuarioId}] Encolado a ${turno.nombre} ${turno.apellido} (${turno.telefono}): ${JSON.stringify(envioResult)}`);

          if (envioResult.ok) {
            // Encolado correctamente. El registro 'enviado' lo hace onResult al entregarse.
            enviados++;
          } else {
            // No se pudo ni encolar (no conectado / teléfono inválido / cola llena).
            await registrarResultado({ ok: false, error: envioResult.error || "No encolado" });
          }
        } catch (error) {
          console.error(`[Recordatorios:${usuarioId}] Error enviando a ${turno.nombre}:`, error.message);
          await registrarResultado({ ok: false, error: error.message });
        }
      }
    } else {
      console.log(`[Recordatorios:${usuarioId}] Notificaciones a pacientes desactivadas, omitiendo.`);
    }

    // ─── Recordatorio al profesional ───
    if (!telefonoProfesional.trim()) {
      console.warn(`[Recordatorios:${usuarioId}] Teléfono del profesional no configurado — omitiendo recordatorio profesional.`);
    }
    if (notificacionesProfesional && telefonoProfesional.trim()) {
      const listaTurnos = turnos
        .map((t) => `• ${formatearHora(t.hora)} - ${t.nombre} ${t.apellido} (${t.consultorio || "consultorio"})`)
        .join("\n");

      const fechaStr = turnos[0].fecha instanceof Date
        ? turnos[0].fecha.toISOString().substring(0, 10)
        : String(turnos[0].fecha).substring(0, 10);

      const mensajeProfesional = reemplazarVariables(mensajeProfesionalTexto, {
        fecha: formatearFecha(fechaStr),
        cantidad: String(turnos.length),
        lista_turnos: listaTurnos,
      });

      // El resumen al profesional sale del NÚMERO CENTRAL DEL SISTEMA cuando está
      // disponible (así suena: viene de un número distinto al del profe). Si el
      // sistema no está activo/conectado, se envía por el propio número del profe
      // como antes (failsafe — el profe igual recibe su resumen, aunque sin sonido).
      const usarSistema = sistemaDisponible();
      const remitenteId = usarSistema ? SISTEMA_ID : usuarioId;
      const telDestino = telefonoProfesional.trim();

      // Registrar el estado real recién al entregarse (mismo criterio que pacientes).
      const registrarResumenProf = async ({ ok, error }) => {
        if (ok) {
          await pool.query(
            `INSERT INTO notificaciones (turno_id, paciente_id, telefono, mensaje, tipo, estado) VALUES (NULL, NULL, $1, $2, 'recordatorio_profesional', 'enviado')`,
            [telDestino, mensajeProfesional]
          );
          console.log(`[Recordatorios:${usuarioId}] ✓ Resumen entregado al profesional (${telDestino}) vía ${usarSistema ? "SISTEMA" : "número propio"}`);
        } else {
          await pool.query(
            `INSERT INTO notificaciones (turno_id, paciente_id, telefono, mensaje, tipo, estado, error_detalle) VALUES (NULL, NULL, $1, $2, 'recordatorio_profesional', 'error', $3)`,
            [telDestino, mensajeProfesional, error || "Fallo de entrega"]
          );
          console.warn(`[Recordatorios:${usuarioId}] ✗ Falló resumen al profesional (${telDestino}): ${error}`);
        }
      };

      try {
        const envioProf = await enviarMensajeWhatsApp({
          usuarioId: remitenteId,
          telefono: telDestino,
          mensaje: mensajeProfesional,
          onResult: registrarResumenProf,
        });
        console.log(`[Recordatorios:${usuarioId}] Resumen encolado vía ${usarSistema ? "SISTEMA" : "propio"} → ${telDestino}: ${JSON.stringify(envioProf)}`);
        if (!envioProf.ok) {
          await registrarResumenProf({ ok: false, error: envioProf.error || "No encolado" });
        }
      } catch (error) {
        console.error(`[Recordatorios:${usuarioId}] Error al enviar al profesional:`, error.message);
        await registrarResumenProf({ ok: false, error: error.message });
      }
    }

    console.log(`[Recordatorios:${usuarioId}] Finalizado: ${enviados}/${turnos.length} pacientes encolados. Tel profesional: "${telefonoProfesional}"`);
    return {
      enviados,
      turnos: turnos.length,
      waConectado: true,
      telefonoProfesional: telefonoProfesional || null,
      mensaje: `${enviados} de ${turnos.length} pacientes encolados${telefonoProfesional ? ` + resumen a ${telefonoProfesional}` : " (sin teléfono del profesional configurado)"}`,
    };

  } catch (error) {
    console.error(`[Recordatorios:${usuarioId}] Error crítico:`, error.message);
    throw error;
  }
}

// Corre cada hora en punto y, para cada usuario con WhatsApp conectado, revisa
// si SU hora_envio configurada coincide con la hora actual (en horario de
// Argentina). De ser así, procesa y envía sus recordatorios — si no, lo saltea
// hasta que llegue su hora. Esto reemplaza la antigua estrategia de "un solo
// cron a una hora global", que no podía servir a usuarios con preferencias de
// horario distintas ni reaccionar a cambios sin reprogramar el cron en caliente.
async function verificarYEjecutarPorHora() {
  const usuariosConectados = getUsuariosConectados();
  if (usuariosConectados.length === 0) return;

  const horaActual = new Date().toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour: "2-digit",
    hour12: false,
  }).padStart(2, "0");

  for (const usuarioId of usuariosConectados) {
    try {
      const configResult = await pool.query(
        "SELECT hora_envio FROM configuracion_notificaciones WHERE usuario_id = $1 LIMIT 1",
        [usuarioId]
      );
      const horaEnvio = configResult.rows[0]?.hora_envio || "17:00";
      const horaConfigurada = horaEnvio.substring(0, 2);

      if (horaConfigurada !== horaActual) continue;

      console.log(`[Recordatorios:${usuarioId}] Hora configurada (${horaEnvio}) coincide con la hora actual — ejecutando job.`);
      await ejecutarJob({ usuarioId });
    } catch (error) {
      console.error(`[Recordatorios:${usuarioId}] Error en verificación horaria:`, error.message);
    }
  }
}

let cronTask = null;

export function iniciarJob() {
  if (cronTask) cronTask.stop();
  cronTask = cron.schedule("0 * * * *", verificarYEjecutarPorHora, {
    timezone: "America/Argentina/Buenos_Aires",
  });
  console.log("[Recordatorios] Job programado: corre cada hora y evalúa la preferencia horaria de cada usuario conectado.");
}

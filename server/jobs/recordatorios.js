import cron from "node-cron";
import pool from "../config/db.js";
import { enviarMensajeWhatsApp, getEstadoWhatsApp } from "../services/whatsapp.js";

const DIAS_ES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function formatearFecha(fecha) {
  const d = new Date(fecha + "T12:00:00Z");
  return `${DIAS_ES[d.getDay()]} ${d.getDate()} de ${MESES_ES[d.getMonth()]}`;
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

export async function ejecutarJob({ forzar = false } = {}) {
  console.log("[Recordatorios] Verificando turnos para mañana...");

  // Verificar estado WhatsApp antes de continuar
  const waEstado = getEstadoWhatsApp();
  if (!waEstado.conectado) {
    console.warn(`[Recordatorios] WhatsApp no conectado (estado: ${waEstado.estado}). Abortando.`);
    return { enviados: 0, turnos: 0, waConectado: false, mensaje: `WhatsApp no conectado (${waEstado.estado})` };
  }

  try {
    const configResult = await pool.query(
      "SELECT * FROM configuracion_notificaciones ORDER BY actualizado_en DESC LIMIT 1"
    );

    const config = configResult.rows[0] || {};
    console.log(`[Recordatorios] Config: notif_pacientes=${config.notificaciones_pacientes}, notif_profesional=${config.notificaciones_profesional}, tel=${config.telefono_profesional}`);

    const notificacionesPacientes = forzar || config.notificaciones_pacientes !== false;
    const notificacionesProfesional = forzar || config.notificaciones_profesional !== false;
    const telefonoProfesional = config.telefono_profesional || "";
    const mensajePacienteTexto = config.mensaje_paciente || 'Hola {nombre}! Te recordamos que tenés turno mañana {fecha} a las {hora} en {consultorio}. Ante cualquier cambio comunicate con nosotros. ¡Hasta mañana!';
    const mensajeProfesionalTexto = config.mensaje_profesional || 'Recordatorio: mañana {fecha} tenés {cantidad} turno(s):\n{lista_turnos}';

    const turnosResult = await pool.query(`
      SELECT t.*, p.nombre, p.apellido, p.telefono
      FROM turnos t
      JOIN pacientes p ON t.paciente_id = p.id
      WHERE t.fecha = CURRENT_DATE + INTERVAL '1 day'
        AND t.estado IN ('pendiente', 'confirmado')
        AND p.telefono IS NOT NULL
        AND p.telefono != ''
    `);

    const turnos = turnosResult.rows;
    console.log(`[Recordatorios] Turnos encontrados para mañana: ${turnos.length}`);

    if (turnos.length === 0) {
      return { enviados: 0, turnos: 0, waConectado: true, mensaje: "No hay turnos para mañana" };
    }

    let enviados = 0;

    // ─── Recordatorios a pacientes ───
    if (notificacionesPacientes) {
      for (const turno of turnos) {
        const yaEnviado = await pool.query(
          `SELECT id FROM notificaciones WHERE turno_id = $1 AND tipo = 'recordatorio_turno' AND estado = 'enviado' AND DATE(enviado_en) = CURRENT_DATE`,
          [turno.id]
        );
        if (yaEnviado.rows.length > 0) {
          console.log(`[Recordatorios] Ya enviado exitosamente hoy para turno ${turno.id} (${turno.nombre} ${turno.apellido})`);
          continue;
        }

        const mensaje = reemplazarVariables(mensajePacienteTexto, {
          nombre: turno.nombre,
          fecha: formatearFecha(turno.fecha),
          hora: formatearHora(turno.hora),
          consultorio: turno.consultorio || "el consultorio",
        });

        try {
          const envioResult = await enviarMensajeWhatsApp({ telefono: turno.telefono, mensaje });
          console.log(`[Recordatorios] Envío a ${turno.nombre} ${turno.apellido} (${turno.telefono}): ${JSON.stringify(envioResult)}`);

          if (envioResult.ok) {
            await pool.query(
              `INSERT INTO notificaciones (turno_id, paciente_id, telefono, mensaje, tipo, estado) VALUES ($1, $2, $3, $4, 'recordatorio_turno', 'enviado')`,
              [turno.id, turno.paciente_id, turno.telefono, mensaje]
            );
            enviados++;
          } else {
            await pool.query(
              `INSERT INTO notificaciones (turno_id, paciente_id, telefono, mensaje, tipo, estado, error_detalle) VALUES ($1, $2, $3, $4, 'recordatorio_turno', 'error', $5)`,
              [turno.id, turno.paciente_id, turno.telefono, mensaje, envioResult.error || "No encolado"]
            );
          }
        } catch (error) {
          console.error(`[Recordatorios] Error enviando a ${turno.nombre}:`, error.message);
          await pool.query(
            `INSERT INTO notificaciones (turno_id, paciente_id, telefono, mensaje, tipo, estado, error_detalle) VALUES ($1, $2, $3, $4, 'recordatorio_turno', 'error', $5)`,
            [turno.id, turno.paciente_id, turno.telefono, mensaje, error.message]
          );
        }
      }
    } else {
      console.log("[Recordatorios] Notificaciones a pacientes desactivadas, omitiendo.");
    }

    // ─── Recordatorio al profesional ───
    if (!telefonoProfesional.trim()) {
      console.warn("[Recordatorios] Teléfono del profesional no configurado — omitiendo recordatorio profesional.");
    }
    if (notificacionesProfesional && telefonoProfesional.trim()) {
      const listaTurnos = turnos
        .map((t) => `• ${formatearHora(t.hora)} - ${t.nombre} ${t.apellido} (${t.consultorio || "consultorio"})`)
        .join("\n");

      const mensajeProfesional = reemplazarVariables(mensajeProfesionalTexto, {
        fecha: formatearFecha(turnos[0].fecha),
        cantidad: String(turnos.length),
        lista_turnos: listaTurnos,
      });

      try {
        const envioProf = await enviarMensajeWhatsApp({ telefono: telefonoProfesional.trim(), mensaje: mensajeProfesional });
        console.log(`[Recordatorios] Envío profesional (${telefonoProfesional}): ${JSON.stringify(envioProf)}`);
        await pool.query(
          `INSERT INTO notificaciones (turno_id, paciente_id, telefono, mensaje, tipo, estado) VALUES (NULL, NULL, $1, $2, 'recordatorio_profesional', 'enviado')`,
          [telefonoProfesional.trim(), mensajeProfesional]
        );
      } catch (error) {
        console.error("[Recordatorios] Error al enviar al profesional:", error.message);
        await pool.query(
          `INSERT INTO notificaciones (turno_id, paciente_id, telefono, mensaje, tipo, estado, error_detalle) VALUES (NULL, NULL, $1, $2, 'recordatorio_profesional', 'error', $3)`,
          [telefonoProfesional.trim(), mensajeProfesional, error.message]
        );
      }
    }

    console.log(`[Recordatorios] Finalizado: ${enviados}/${turnos.length} pacientes encolados. Tel profesional: "${telefonoProfesional}"`);
    return {
      enviados,
      turnos: turnos.length,
      waConectado: true,
      telefonoProfesional: telefonoProfesional || null,
      mensaje: `${enviados} de ${turnos.length} pacientes encolados${telefonoProfesional ? ` + resumen a ${telefonoProfesional}` : " (sin teléfono del profesional configurado)"}`,
    };

  } catch (error) {
    console.error("[Recordatorios] Error crítico:", error.message);
    throw error;
  }
}

let cronTask = null;

export async function iniciarJob() {
  try {
    const configResult = await pool.query(
      "SELECT hora_envio FROM configuracion_notificaciones ORDER BY actualizado_en DESC LIMIT 1"
    );
    const horaEnvio = configResult.rows[0]?.hora_envio || "17:00";
    const [hora, minuto] = horaEnvio.split(":");

    if (cronTask) cronTask.stop();
    cronTask = cron.schedule(`${minuto} ${hora} * * *`, () => { ejecutarJob(); });
    console.log(`[Recordatorios] Job programado para las ${horaEnvio} hs`);
  } catch (error) {
    console.error("[Recordatorios] Error al iniciar job:", error.message);
    if (cronTask) cronTask.stop();
    cronTask = cron.schedule("0 17 * * *", () => { ejecutarJob(); });
    console.log("[Recordatorios] Job programado para las 17:00 hs (fallback)");
  }
}

export async function reiniciarJob() {
  await iniciarJob();
}

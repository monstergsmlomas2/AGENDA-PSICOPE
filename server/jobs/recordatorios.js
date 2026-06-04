import cron from "node-cron";
import pool from "../config/db.js";
import { enviarMensajeWhatsApp } from "../services/whatsapp.js";

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

async function ejecutarJob() {
  console.log("[Recordatorios] Verificando turnos para mañana...");

  try {
    // Leer configuración de notificaciones — toma la primera fila activa (puede haber una sola profesional)
    const configResult = await pool.query(
      "SELECT * FROM configuracion_notificaciones ORDER BY actualizado_en DESC LIMIT 1"
    );

    // Si no hay configuración, usar valores por defecto
    const config = configResult.rows[0] || {};
    console.log(`[Recordatorios] Usando config: notif_pacientes=${config.notificaciones_pacientes}, notif_profesional=${config.notificaciones_profesional}, tel=${config.telefono_profesional}`);
    const notificacionesPacientes = config.notificaciones_pacientes !== false;
    const notificacionesProfesional = config.notificaciones_profesional !== false;
    const telefonoProfesional = config.telefono_profesional || "";
    const mensajePacienteTexto = config.mensaje_paciente || 'Hola {nombre}! Te recordamos que tenés turno mañana {fecha} a las {hora} en {consultorio}. Ante cualquier cambio comunicate con nosotros. ¡Hasta mañana!';
    const mensajeProfesionalTexto = config.mensaje_profesional || 'Recordatorio: mañana {fecha} tenés {cantidad} turno(s):\n{lista_turnos}';

    const result = await pool.query(`
      SELECT t.*, p.nombre, p.apellido, p.telefono
      FROM turnos t
      JOIN pacientes p ON t.paciente_id = p.id
      WHERE t.fecha = CURRENT_DATE + INTERVAL '1 day'
        AND t.estado IN ('pendiente', 'confirmado')
        AND p.telefono IS NOT NULL
        AND p.telefono != ''
    `);

    let enviados = 0;

    // ─── Recordatorios a pacientes ───
    if (notificacionesPacientes) {
      for (const turno of result.rows) {
        const yaEnviado = await pool.query(
          `SELECT id FROM notificaciones WHERE turno_id = $1 AND tipo = 'recordatorio_turno' AND DATE(enviado_en) = CURRENT_DATE`,
          [turno.id]
        );

        if (yaEnviado.rows.length > 0) {
          continue;
        }

        const mensaje = reemplazarVariables(mensajePacienteTexto, {
          nombre: turno.nombre,
          fecha: formatearFecha(turno.fecha),
          hora: formatearHora(turno.hora),
          consultorio: turno.consultorio,
        });

        try {
          const result = await enviarMensajeWhatsApp({
            telefono: turno.telefono,
            mensaje,
          });

          console.log(`[Recordatorios] enviarMensaje → ${JSON.stringify(result)} | paciente: ${turno.nombre} ${turno.apellido} | tel: ${turno.telefono}`);

          if (result.ok) {
            await pool.query(
              `INSERT INTO notificaciones (turno_id, paciente_id, telefono, mensaje, tipo, estado) VALUES ($1, $2, $3, $4, 'recordatorio_turno', 'enviado')`,
              [turno.id, turno.paciente_id, turno.telefono, mensaje]
            );
            enviados++;
          }
        } catch (error) {
          await pool.query(
            `INSERT INTO notificaciones (turno_id, paciente_id, telefono, mensaje, tipo, estado, error_detalle) VALUES ($1, $2, $3, $4, 'recordatorio_turno', 'error', $5)`,
            [turno.id, turno.paciente_id, turno.telefono, mensaje, error.message]
          );
        }
      }
    }

    // ─── Recordatorio al profesional ───
    if (notificacionesProfesional && telefonoProfesional.trim()) {
      const turnosManana = result.rows;

      if (turnosManana.length > 0) {
        const fechaManana = turnosManana[0].fecha;
        const listaTurnos = turnosManana
          .map((t) => `• ${formatearHora(t.hora)} - ${t.nombre} ${t.apellido} (${t.consultorio})`)
          .join("\n");

        const mensajeProfesional = reemplazarVariables(mensajeProfesionalTexto, {
          fecha: formatearFecha(fechaManana),
          cantidad: String(turnosManana.length),
          lista_turnos: listaTurnos,
        });

        try {
          await enviarMensajeWhatsApp({
            telefono: telefonoProfesional.trim(),
            mensaje: mensajeProfesional,
          });

          await pool.query(
            `INSERT INTO notificaciones (turno_id, paciente_id, telefono, mensaje, tipo, estado) VALUES (NULL, NULL, $1, $2, 'recordatorio_profesional', 'enviado')`,
            [telefonoProfesional.trim(), mensajeProfesional]
          );

          console.log("[Recordatorios] Recordatorio enviado al profesional.");
        } catch (error) {
          await pool.query(
            `INSERT INTO notificaciones (turno_id, paciente_id, telefono, mensaje, tipo, estado, error_detalle) VALUES (NULL, NULL, $1, $2, 'recordatorio_profesional', 'error', $3)`,
            [telefonoProfesional.trim(), mensajeProfesional, error.message]
          );

          console.error("[Recordatorios] Error al enviar recordatorio al profesional:", error.message);
        }
      }
    }

    console.log(`[Recordatorios] ${enviados} recordatorios enviados.`);
  } catch (error) {
    console.error("[Recordatorios] Error al ejecutar job:", error.message);
  }
}

let cronTask = null;

export async function iniciarJob() {
  try {
    const configResult = await pool.query(
      "SELECT hora_envio FROM configuracion_notificaciones WHERE id = 1"
    );

    const horaEnvio = configResult.rows[0]?.hora_envio || "17:00";
    const [hora, minuto] = horaEnvio.split(":");
    const expresion = `${minuto} ${hora} * * *`;

    // Destruir tarea previa si existe
    if (cronTask) {
      cronTask.stop();
    }

    cronTask = cron.schedule(expresion, () => {
      ejecutarJob();
    });

    console.log(`[Recordatorios] Job programado para las ${horaEnvio} hs`);
  } catch (error) {
    console.error("[Recordatorios] Error al iniciar job:", error.message);
    // Fallback: programar a las 17:00 si hay error
    if (cronTask) cronTask.stop();
    cronTask = cron.schedule("0 17 * * *", () => {
      ejecutarJob();
    });
    console.log("[Recordatorios] Job programado para las 17:00 hs (fallback)");
  }
}

export async function reiniciarJob() {
  await iniciarJob();
}

export { ejecutarJob };

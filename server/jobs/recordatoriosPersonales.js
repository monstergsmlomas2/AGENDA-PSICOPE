import cron from "node-cron";
import pool from "../config/db.js";
import { enviarMensajeWhatsApp, getEstadoWhatsApp } from "../services/whatsapp.js";

function formatearHoraArgentina(fechaHora) {
  return new Date(fechaHora).toLocaleTimeString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatearFechaArgentina(fechaHora) {
  return new Date(fechaHora).toLocaleDateString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export async function ejecutarJobPersonal() {
  const waEstado = getEstadoWhatsApp();
  if (!waEstado.conectado) {
    console.log(`[AgendaPersonal] WhatsApp no conectado (${waEstado.estado}). Saltando.`);
    return;
  }

  try {
    // Buscar recordatorios pendientes cuyo momento de envío ya llegó
    // momento_envio = fecha_hora del evento - minutos_antes
    const result = await pool.query(`
      SELECT
        apr.id          AS recordatorio_id,
        apr.minutos_antes,
        ap.id           AS evento_id,
        ap.titulo,
        ap.descripcion,
        ap.fecha_hora,
        ap.profesional_id,
        cn.telefono_profesional
      FROM agenda_personal_recordatorios apr
      JOIN agenda_personal ap ON ap.id = apr.evento_id
      JOIN configuracion_notificaciones cn ON cn.usuario_id = ap.profesional_id
      WHERE apr.enviado = false
        AND ap.estado = 'pendiente'
        AND cn.telefono_profesional IS NOT NULL
        AND cn.telefono_profesional != ''
        AND (ap.fecha_hora - (apr.minutos_antes || ' minutes')::INTERVAL)
            <= (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')
    `);

    if (result.rows.length === 0) return;

    console.log(`[AgendaPersonal] ${result.rows.length} recordatorio(s) para enviar.`);

    for (const row of result.rows) {
      try {
        const hora = formatearHoraArgentina(row.fecha_hora);
        const fecha = formatearFechaArgentina(row.fecha_hora);

        let cuandoLabel;
        if (row.minutos_antes >= 1440) {
          const horas = row.minutos_antes / 60;
          cuandoLabel = horas >= 24 ? `${Math.round(horas / 24)} día(s) antes` : `${horas} hora(s) antes`;
        } else if (row.minutos_antes >= 60) {
          cuandoLabel = `${row.minutos_antes / 60} hora(s) antes`;
        } else {
          cuandoLabel = `${row.minutos_antes} minutos antes`;
        }

        const partes = [
          `⏰ *Recordatorio Personal*`,
          `📌 ${row.titulo}`,
          `📅 ${fecha} a las ${hora}`,
        ];
        if (row.descripcion?.trim()) partes.push(`📝 ${row.descripcion}`);
        partes.push(`🔔 ${cuandoLabel}`);

        await enviarMensajeWhatsApp({
          telefono: row.telefono_profesional,
          mensaje: partes.join("\n"),
        });

        await pool.query(
          `UPDATE agenda_personal_recordatorios
           SET enviado = true, enviado_at = NOW()
           WHERE id = $1`,
          [row.recordatorio_id]
        );

        console.log(
          `[AgendaPersonal] Recordatorio enviado: "${row.titulo}" (evento:${row.evento_id} rec:${row.recordatorio_id} ${row.minutos_antes}min)`
        );
      } catch (err) {
        console.error(
          `[AgendaPersonal] Error enviando recordatorio ${row.recordatorio_id} ("${row.titulo}"):`,
          err.message
        );
        // Marcar como enviado para no reintentar infinitamente
        await pool.query(
          `UPDATE agenda_personal_recordatorios SET enviado = true WHERE id = $1`,
          [row.recordatorio_id]
        ).catch(() => {});
      }
    }
  } catch (err) {
    console.error("[AgendaPersonal] Error crítico en job:", err.message);
  }
}

export function iniciarJobPersonal() {
  cron.schedule("*/5 * * * *", ejecutarJobPersonal, {
    timezone: "America/Argentina/Buenos_Aires",
  });
  console.log("[AgendaPersonal] Job de recordatorios personales iniciado (cada 5 min).");
}

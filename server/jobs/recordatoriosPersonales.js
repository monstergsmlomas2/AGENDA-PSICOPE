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

export async function ejecutarJobPersonal() {
  const waEstado = getEstadoWhatsApp();
  if (!waEstado.conectado) {
    console.log(`[AgendaPersonal] WhatsApp no conectado (${waEstado.estado}). Saltando.`);
    return;
  }

  try {
    const result = await pool.query(`
      SELECT ap.*, cn.telefono_profesional
      FROM agenda_personal ap
      JOIN configuracion_notificaciones cn ON cn.usuario_id = ap.profesional_id
      WHERE ap.estado = 'pendiente'
        AND ap.whatsapp_enviado = false
        AND (ap.fecha_hora - (ap.recordatorio_minutos || ' minutes')::INTERVAL)
            <= (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')
        AND cn.telefono_profesional IS NOT NULL
        AND cn.telefono_profesional != ''
    `);

    if (result.rows.length === 0) return;

    console.log(`[AgendaPersonal] ${result.rows.length} recordatorio(s) para enviar.`);

    for (const evento of result.rows) {
      try {
        const hora = formatearHoraArgentina(evento.fecha_hora);
        const descripcionLinea = evento.descripcion?.trim()
          ? `📝 ${evento.descripcion}`
          : null;

        const partes = [
          `⏰ *Recordatorio Personal*`,
          `📌 ${evento.titulo}`,
          `📅 Hoy a las ${hora}`,
        ];
        if (descripcionLinea) partes.push(descripcionLinea);
        const mensaje = partes.join("\n");

        await enviarMensajeWhatsApp({ telefono: evento.telefono_profesional, mensaje });

        await pool.query(
          `UPDATE agenda_personal SET whatsapp_enviado = true WHERE id = $1`,
          [evento.id]
        );

        console.log(`[AgendaPersonal] Recordatorio enviado: "${evento.titulo}" (id: ${evento.id})`);
      } catch (err) {
        console.error(`[AgendaPersonal] Error enviando recordatorio evento ${evento.id} ("${evento.titulo}"):`, err.message);
        console.warn(`[AgendaPersonal] Marcando evento ${evento.id} como enviado para no reintentar — el profesional NO recibió el recordatorio.`);
        await pool.query(
          `UPDATE agenda_personal SET whatsapp_enviado = true WHERE id = $1`,
          [evento.id]
        ).catch((dbErr) => console.error(`[AgendaPersonal] No se pudo marcar evento ${evento.id}:`, dbErr.message));
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

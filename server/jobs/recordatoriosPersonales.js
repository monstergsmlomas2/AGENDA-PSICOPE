import cron from "node-cron";
import pool from "../config/db.js";
import { enviarMensajeWhatsApp, getEstadoWhatsApp } from "../services/whatsapp.js";
import { enviarPushAUsuario } from "../routes/push.js";

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
  try {
    // Verificar que la tabla existe antes de operar
    const tableCheck = await pool.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'agenda_personal_recordatorios')`
    );
    if (!tableCheck.rows[0].exists) {
      console.warn("[AgendaPersonal] Tabla agenda_personal_recordatorios no existe — ejecutar migration 018.");
      return;
    }

    // Reclamar de forma ATÓMICA los recordatorios cuyo momento de envío ya llegó.
    // El UPDATE ... RETURNING marca enviado=true en la misma operación que los
    // selecciona: así un recordatorio nunca puede ser tomado dos veces (evita
    // el envío repetido por ciclos solapados del job).
    //
    // Límite inferior (NOW() - 1 día): no enviar avisos de eventos muy viejos
    // que quedaron pendientes. Límite superior (<= NOW()): no adelantar avisos
    // de mañana — solo dispara cuando el momento de envío realmente llegó.
    const result = await pool.query(`
      UPDATE agenda_personal_recordatorios apr
      SET enviado = true, enviado_at = NOW()
      FROM agenda_personal ap, configuracion_notificaciones cn
      WHERE apr.evento_id = ap.id
        AND cn.usuario_id = ap.profesional_id
        AND apr.enviado = false
        AND ap.estado = 'pendiente'
        AND cn.telefono_profesional IS NOT NULL
        AND cn.telefono_profesional != ''
        AND (ap.fecha_hora - (apr.minutos_antes || ' minutes')::INTERVAL)
            BETWEEN (NOW() - INTERVAL '1 day') AND NOW()
      RETURNING
        apr.id          AS recordatorio_id,
        apr.minutos_antes,
        ap.id           AS evento_id,
        ap.titulo,
        ap.descripcion,
        ap.fecha_hora,
        ap.profesional_id,
        cn.telefono_profesional
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

        // El recordatorio ya fue marcado enviado=true de forma atómica en el
        // UPDATE ... RETURNING de arriba, así que acá solo encolamos el envío.

        // WhatsApp (si la sesión de ESTE profesional está conectada — cada
        // usuario tiene su propio socket, aislado del resto)
        if (getEstadoWhatsApp(row.profesional_id).conectado) {
          await enviarMensajeWhatsApp({
            usuarioId: row.profesional_id,
            telefono: row.telefono_profesional,
            mensaje: partes.join("\n"),
          });
        }

        // Push notification (independiente de WhatsApp)
        await enviarPushAUsuario(row.profesional_id, {
          title: `⏰ ${row.titulo}`,
          body: `📅 ${fecha} a las ${hora} — ${cuandoLabel}`,
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          tag: `recordatorio-${row.recordatorio_id}`,
          data: { url: "/mi-agenda" },
        });

        console.log(
          `[AgendaPersonal] Recordatorio enviado: "${row.titulo}" (evento:${row.evento_id} rec:${row.recordatorio_id} ${row.minutos_antes}min)`
        );
      } catch (err) {
        console.error(
          `[AgendaPersonal] Error enviando recordatorio ${row.recordatorio_id} ("${row.titulo}"):`,
          err.message
        );
        // Ya está marcado enviado=true; no se reintenta (evita spam por reenvío).
      }
    }
  } catch (err) {
    console.error("[AgendaPersonal] Error crítico en job:", err.message);
    // Si la tabla no existe aún, loggear claro y no reintentar hasta el próximo ciclo
    if (err.message.includes("does not exist") || err.message.includes("relation")) {
      console.error("[AgendaPersonal] Tabla agenda_personal_recordatorios no encontrada — ejecutar migration 018 en Supabase.");
    }
  }
}

export function iniciarJobPersonal() {
  cron.schedule("*/5 * * * *", ejecutarJobPersonal, {
    timezone: "America/Argentina/Buenos_Aires",
  });
  console.log("[AgendaPersonal] Job de recordatorios personales iniciado (cada 5 min).");
}

import { Router } from "express";
import webpush from "web-push";
import pool from "../config/db.js";

const router = Router();

function initVapid() {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return false;
  try {
    webpush.setVapidDetails(
      process.env.VAPID_MAILTO || "mailto:admin@psicope.app",
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    return true;
  } catch (err) {
    console.error("[Push] VAPID init error:", err.message);
    return false;
  }
}

// GET /push/vapid-public-key — clave pública para que el cliente se suscriba
router.get("/vapid-public-key", (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// POST /push/suscribir — guardar suscripción del dispositivo
router.post("/suscribir", async (req, res) => {
  const { subscription } = req.body;
  if (!subscription?.endpoint) {
    return res.status(400).json({ error: "Suscripción inválida" });
  }
  try {
    await pool.query(
      `INSERT INTO push_subscriptions (usuario_id, endpoint, p256dh, auth)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (usuario_id, endpoint) DO UPDATE
         SET p256dh = $3, auth = $4, updated_at = NOW()`,
      [
        req.userId,
        subscription.endpoint,
        subscription.keys.p256dh,
        subscription.keys.auth,
      ]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("[Push] Error guardando suscripción:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /push/desuscribir — eliminar suscripción del dispositivo
router.delete("/desuscribir", async (req, res) => {
  const { endpoint } = req.body;
  try {
    await pool.query(
      `DELETE FROM push_subscriptions WHERE usuario_id = $1 AND endpoint = $2`,
      [req.userId, endpoint]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /push/estado — si el usuario tiene alguna suscripción activa
router.get("/estado", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) FROM push_subscriptions WHERE usuario_id = $1`,
      [req.userId]
    );
    res.json({ activo: parseInt(result.rows[0].count) > 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

// ── Función exportada para enviar push desde jobs ─────────────────────────────
export async function enviarPushAUsuario(usuarioId, payload) {
  if (!initVapid()) return; // sin VAPID keys configuradas, skip silencioso
  try {
    const result = await pool.query(
      `SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE usuario_id = $1`,
      [usuarioId]
    );
    if (!result.rows.length) return;

    const notif = JSON.stringify(payload);

    for (const row of result.rows) {
      const subscription = {
        endpoint: row.endpoint,
        keys: { p256dh: row.p256dh, auth: row.auth },
      };
      try {
        await webpush.sendNotification(subscription, notif);
      } catch (err) {
        // 410 Gone = el dispositivo ya no tiene esta suscripción, limpiar
        if (err.statusCode === 410 || err.statusCode === 404) {
          await pool.query(
            `DELETE FROM push_subscriptions WHERE endpoint = $1`,
            [row.endpoint]
          );
          console.log(`[Push] Suscripción expirada eliminada: ${row.endpoint.substring(0, 50)}...`);
        } else {
          console.error(`[Push] Error enviando a ${row.endpoint.substring(0, 50)}:`, err.message);
        }
      }
    }
  } catch (err) {
    console.error("[Push] Error en enviarPushAUsuario:", err.message);
  }
}

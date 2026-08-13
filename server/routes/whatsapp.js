import { Router } from "express";
import pool from "../config/db.js";
import {
  iniciarWhatsApp,
  cerrarSesionWhatsApp,
  getEstadoWhatsApp,
  getQRWhatsApp,
} from "../services/whatsapp.js";
import { ejecutarJob } from "../jobs/recordatorios.js";

const router = Router();

router.use((req, res, next) => {
  if (process.env.WHATSAPP_PAUSADO === "true") {
    if (req.path === "/status") {
      return res.json({ estado: "PAUSADO", mensaje: "WhatsApp está pausado para ahorrar recursos." });
    }
    return res.status(503).json({ error: "WhatsApp está pausado. Quitá WHATSAPP_PAUSADO para reactivar." });
  }
  next();
});

// GET /whatsapp/status — estado de conexión (de la sesión del usuario autenticado)
router.get("/status", (req, res) => {
  res.json(getEstadoWhatsApp(req.userId));
});

// GET /whatsapp/qr — QR en base64 para mostrar en la UI
router.get("/qr", (req, res) => {
  const qr = getQRWhatsApp(req.userId);
  if (!qr) return res.json({ qr: null });
  res.json({ qr });
});

// POST /whatsapp/conectar — inicia la conexión y genera el QR para este usuario
router.post("/conectar", async (req, res) => {
  try {
    await iniciarWhatsApp(req.userId);
    res.json({ ok: true, mensaje: "Iniciando conexión..." });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /whatsapp/desconectar — cierra la sesión de este usuario y borra sus datos
router.post("/desconectar", async (req, res) => {
  try {
    await cerrarSesionWhatsApp(req.userId);
    res.json({ ok: true, mensaje: "Sesión cerrada." });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /whatsapp/enviar-recordatorios — envía solo a pacientes (de este usuario)
router.post("/enviar-recordatorios", async (req, res) => {
  try {
    const resultado = await ejecutarJob({ usuarioId: req.userId, forzar: true, soloProf: false });
    res.json({ ok: true, ...resultado });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /whatsapp/enviar-resumen-profesional — envía solo al profesional (este usuario)
router.post("/enviar-resumen-profesional", async (req, res) => {
  try {
    const resultado = await ejecutarJob({ usuarioId: req.userId, forzar: true, soloPacientes: false, soloProf: true });
    res.json({ ok: true, ...resultado });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /whatsapp/diagnostico — muestra estado real del servidor para este usuario
router.get("/diagnostico", async (req, res) => {
  try {
    const wa = getEstadoWhatsApp(req.userId);

    const configResult = await pool.query(
      "SELECT notificaciones_pacientes, notificaciones_profesional, telefono_profesional, hora_envio FROM configuracion_notificaciones WHERE usuario_id = $1 LIMIT 1",
      [req.userId]
    );

    const turnosResult = await pool.query(`
      SELECT t.id, t.fecha, t.hora, t.estado, p.nombre, p.apellido, p.telefono
      FROM turnos t
      JOIN pacientes p ON t.paciente_id = p.id
      WHERE t.usuario_id = $1
        AND t.fecha = (CURRENT_TIMESTAMP AT TIME ZONE 'America/Argentina/Buenos_Aires')::date + INTERVAL '1 day'
        AND t.estado IN ('pendiente', 'confirmado')
        AND p.telefono IS NOT NULL AND p.telefono != ''
    `, [req.userId]);

    res.json({
      whatsapp: wa,
      config: configResult.rows[0] || null,
      turnosManana: turnosResult.rows.length,
      turnos: turnosResult.rows.map(t => ({
        id: t.id,
        paciente: `${t.nombre} ${t.apellido}`,
        telefono: t.telefono,
        fecha: t.fecha,
        hora: t.hora,
        estado: t.estado,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

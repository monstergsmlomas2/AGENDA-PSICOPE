import express from "express";
import {
  iniciarWhatsApp,
  cerrarSesionWhatsApp,
  getEstadoWhatsApp,
  getQRWhatsApp,
  SISTEMA_ID,
  modoSistemaActivo,
} from "../services/whatsapp.js";

const router = express.Router();

// ── Rutas de ADMINISTRACIÓN del número central de Agenda Psicope ──────────────
// Estas rutas NO usan authMiddleware (no pertenecen a un usuario de la app). Son
// SOLO para los desarrolladores: conectan y administran el número del sistema que
// envía los resúmenes profesionales. Se protegen con un secreto compartido
// (ADMIN_SECRET) que únicamente ustedes conocen — los usuarios no tienen acceso.
//
// IMPORTANTE: ningún usuario ve ni edita esto. No hay UI en la app para esto.
// El número se conecta una sola vez escaneando el QR desde estas rutas.

function requireAdminSecret(req, res, next) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    return res.status(503).json({ error: "ADMIN_SECRET no configurado en el servidor." });
  }
  const provided = req.headers["x-admin-secret"] || req.query.secret;
  if (provided !== secret) {
    return res.status(401).json({ error: "No autorizado." });
  }
  next();
}

router.use(requireAdminSecret);

// GET /admin/sistema/estado — estado de la sesión del número central
router.get("/sistema/estado", (req, res) => {
  const { estado, conectado } = getEstadoWhatsApp(SISTEMA_ID);
  res.json({
    modoActivo: modoSistemaActivo(),
    estado,
    conectado,
    nota: modoSistemaActivo()
      ? "Modo sistema ACTIVO. Los resúmenes al profesional salen de este número cuando está conectado."
      : "Modo sistema INACTIVO (WHATSAPP_SISTEMA_ENABLED no es 'true'). Los resúmenes salen del número de cada profesional.",
  });
});

// POST /admin/sistema/conectar — inicia la conexión (genera QR para escanear)
router.post("/sistema/conectar", async (req, res) => {
  try {
    await iniciarWhatsApp(SISTEMA_ID);
    res.json({ ok: true, mensaje: "Conexión iniciada. Consultá /admin/sistema/qr para escanear." });
  } catch (error) {
    console.error("[Admin] Error conectando número del sistema:", error.message);
    res.status(500).json({ error: "Error al iniciar la conexión del sistema." });
  }
});

// GET /admin/sistema/qr — QR en base64 para vincular el número central
router.get("/sistema/qr", (req, res) => {
  const qr = getQRWhatsApp(SISTEMA_ID);
  const { estado } = getEstadoWhatsApp(SISTEMA_ID);
  if (!qr) {
    return res.json({ qr: null, estado, mensaje: "No hay QR disponible (¿ya conectado o sin iniciar?)." });
  }
  // Como conveniencia, si se pide ?html=1 se devuelve una página simple con el QR
  // renderizado, para escanear directo desde el navegador sin herramientas extra.
  if (req.query.html === "1") {
    return res.send(`<!doctype html><html><head><meta charset="utf-8"><title>QR Sistema Agenda Psicope</title></head>
      <body style="font-family:sans-serif;text-align:center;padding:40px;background:#faf5ff">
      <h2>Vincular número central de Agenda Psicope</h2>
      <p>Estado: <b>${estado}</b></p>
      <img src="${qr}" alt="QR" style="width:320px;height:320px"/>
      <p>Abrí WhatsApp → Dispositivos vinculados → Vincular dispositivo y escaneá.</p>
      </body></html>`);
  }
  res.json({ qr, estado });
});

// POST /admin/sistema/desconectar — cierra la sesión del número central
router.post("/sistema/desconectar", async (req, res) => {
  try {
    await cerrarSesionWhatsApp(SISTEMA_ID);
    res.json({ ok: true, mensaje: "Número del sistema desconectado." });
  } catch (error) {
    console.error("[Admin] Error desconectando número del sistema:", error.message);
    res.status(500).json({ error: "Error al desconectar el sistema." });
  }
});

export default router;

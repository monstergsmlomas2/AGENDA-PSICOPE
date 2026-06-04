import { Router } from "express";
import {
  iniciarWhatsApp,
  cerrarSesionWhatsApp,
  getEstadoWhatsApp,
  getQRWhatsApp,
} from "../services/whatsapp.js";
import { ejecutarJob } from "../jobs/recordatorios.js";

const router = Router();

// GET /whatsapp/status — estado de conexión
router.get("/status", (req, res) => {
  res.json(getEstadoWhatsApp());
});

// GET /whatsapp/qr — QR en base64 para mostrar en la UI
router.get("/qr", (req, res) => {
  const qr = getQRWhatsApp();
  if (!qr) return res.json({ qr: null });
  res.json({ qr });
});

// POST /whatsapp/conectar — inicia la conexión y genera el QR
router.post("/conectar", async (req, res) => {
  try {
    await iniciarWhatsApp();
    res.json({ ok: true, mensaje: "Iniciando conexión..." });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /whatsapp/desconectar — cierra sesión y borra datos
router.post("/desconectar", async (req, res) => {
  try {
    await cerrarSesionWhatsApp();
    res.json({ ok: true, mensaje: "Sesión cerrada." });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /whatsapp/enviar-recordatorios — dispara el job manualmente
router.post("/enviar-recordatorios", async (req, res) => {
  try {
    const resultado = await ejecutarJob();
    res.json({ ok: true, ...resultado });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;

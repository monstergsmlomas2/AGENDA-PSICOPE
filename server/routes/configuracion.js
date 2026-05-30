import express from "express";
import pool from "../config/db.js";
import { reiniciarJob, ejecutarJob } from "../jobs/recordatorios.js";

const router = express.Router();

// GET /configuracion — devuelve la configuración del perfil profesional
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nombre_profesional, especialidad, matricula, telefono_profesional AS telefono, email, 
              notificaciones_pacientes, notificaciones_profesional, hora_envio,
              mensaje_paciente, mensaje_profesional, actualizado_en
       FROM configuracion_notificaciones WHERE id = 1 AND usuario_id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Configuración no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener configuración" });
  }
});

// GET /configuracion/notificaciones — devuelve la fila única (id=1)
router.get("/notificaciones", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM configuracion_notificaciones WHERE id = 1 AND usuario_id = $1",
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Configuración no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener configuración de notificaciones" });
  }
});

// PUT /configuracion/notificaciones — actualiza la fila única (id=1)
router.put("/notificaciones", async (req, res) => {
  const {
    notificaciones_pacientes,
    notificaciones_profesional,
    telefono_profesional,
    hora_envio,
    mensaje_paciente,
    mensaje_profesional,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE configuracion_notificaciones SET
        notificaciones_pacientes = COALESCE($1, notificaciones_pacientes),
        notificaciones_profesional = COALESCE($2, notificaciones_profesional),
        telefono_profesional = COALESCE($3, telefono_profesional),
        hora_envio = COALESCE($4, hora_envio),
        mensaje_paciente = COALESCE($5, mensaje_paciente),
        mensaje_profesional = COALESCE($6, mensaje_profesional),
        actualizado_en = NOW()
      WHERE id = 1 AND usuario_id = $7
      RETURNING *`,
      [
        notificaciones_pacientes,
        notificaciones_profesional,
        telefono_profesional,
        hora_envio,
        mensaje_paciente,
        mensaje_profesional,
        req.userId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Configuración no encontrada" });
    }

    // Reprogramar el cron job con la nueva hora
    await reiniciarJob();

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar configuración de notificaciones" });
  }
});

// POST /configuracion/notificaciones/test — dispara el job manualmente
router.post("/notificaciones/test", async (req, res) => {
  try {
    await ejecutarJob();
    res.json({ ok: true, mensaje: "Job ejecutado manualmente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al ejecutar el job" });
  }
});

// PUT /configuracion/whatsapp — actualiza configuración de recordatorios WhatsApp
router.put("/whatsapp", async (req, res) => {
  const {
    recordatorios_activos,
    horas_anticipacion,
    mensaje_personalizado,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE configuracion_notificaciones SET
        recordatorios_activos = COALESCE($1, recordatorios_activos),
        horas_anticipacion = COALESCE($2, horas_anticipacion),
        mensaje_personalizado = COALESCE($3, mensaje_personalizado),
        actualizado_en = NOW()
      WHERE id = 1 AND usuario_id = $4
      RETURNING *`,
      [
        recordatorios_activos,
        horas_anticipacion,
        mensaje_personalizado,
        req.userId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Configuración no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar configuración de WhatsApp" });
  }
});

// GET /configuracion/historial-whatsapp — últimos 10 envíos
router.get("/historial-whatsapp", async (req, res) => {
  try {
    // Verificar si la tabla recordatorios_log existe
    const tableCheck = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'recordatorios_log'
      )`
    );

    if (!tableCheck.rows[0].exists) {
      return res.json([]);
    }

    const result = await pool.query(
      `SELECT id, paciente_nombre, enviado_at, estado
       FROM recordatorios_log
       WHERE usuario_id = $1
       ORDER BY enviado_at DESC
       LIMIT 10`,
      [req.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener historial de WhatsApp" });
  }
});

export default router;

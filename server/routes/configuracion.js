import express from "express";
import pool from "../config/db.js";
import { reiniciarJob, ejecutarJob } from "../jobs/recordatorios.js";

const router = express.Router();

// GET /configuracion — devuelve la configuración del perfil profesional
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nombre_profesional, especialidad, matricula, telefono_profesional, email,
              notificaciones_pacientes, notificaciones_profesional, hora_envio,
              mensaje_paciente, mensaje_profesional,
              plantilla_cancelacion, plantilla_cambio_horario, plantilla_aviso_libre,
              actualizado_en
       FROM configuracion_notificaciones WHERE usuario_id = $1 LIMIT 1`,
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

// GET /configuracion/notificaciones — devuelve la fila del usuario (upsert si no existe)
router.get("/notificaciones", async (req, res) => {
  try {
    const result = await pool.query(
      `INSERT INTO configuracion_notificaciones (usuario_id)
       VALUES ($1)
       ON CONFLICT (usuario_id) DO UPDATE SET usuario_id = EXCLUDED.usuario_id
       RETURNING *`,
      [req.userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener configuración de notificaciones" });
  }
});

// PUT /configuracion/notificaciones — upsert por usuario_id
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
      `INSERT INTO configuracion_notificaciones
        (usuario_id, notificaciones_pacientes, notificaciones_profesional, telefono_profesional, hora_envio, mensaje_paciente, mensaje_profesional, actualizado_en)
       VALUES ($7, $1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (usuario_id) DO UPDATE SET
        notificaciones_pacientes = COALESCE($1, configuracion_notificaciones.notificaciones_pacientes),
        notificaciones_profesional = COALESCE($2, configuracion_notificaciones.notificaciones_profesional),
        telefono_profesional = COALESCE($3, configuracion_notificaciones.telefono_profesional),
        hora_envio = COALESCE($4, configuracion_notificaciones.hora_envio),
        mensaje_paciente = COALESCE($5, configuracion_notificaciones.mensaje_paciente),
        mensaje_profesional = COALESCE($6, configuracion_notificaciones.mensaje_profesional),
        actualizado_en = NOW()
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

// PUT /configuracion/perfil — actualiza datos del perfil profesional
router.put("/perfil", async (req, res) => {
  const { nombre_profesional, especialidad, matricula, email, telefono_profesional } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO configuracion_notificaciones (usuario_id, nombre_profesional, especialidad, matricula, email, telefono_profesional, actualizado_en)
       VALUES ($6, $1, $2, $3, $4, $5, NOW())
       ON CONFLICT (usuario_id) DO UPDATE SET
        nombre_profesional = COALESCE($1, configuracion_notificaciones.nombre_profesional),
        especialidad = COALESCE($2, configuracion_notificaciones.especialidad),
        matricula = COALESCE($3, configuracion_notificaciones.matricula),
        email = COALESCE($4, configuracion_notificaciones.email),
        telefono_profesional = COALESCE($5, configuracion_notificaciones.telefono_profesional),
        actualizado_en = NOW()
       RETURNING *`,
      [nombre_profesional, especialidad, matricula, email, telefono_profesional, req.userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar perfil profesional" });
  }
});

// PUT /configuracion/plantillas-notificaciones — upsert plantillas de avisos a pacientes
router.put("/plantillas-notificaciones", async (req, res) => {
  const { plantilla_cancelacion, plantilla_cambio_horario, plantilla_aviso_libre } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO configuracion_notificaciones (usuario_id, plantilla_cancelacion, plantilla_cambio_horario, plantilla_aviso_libre, actualizado_en)
       VALUES ($4, $1, $2, $3, NOW())
       ON CONFLICT (usuario_id) DO UPDATE SET
        plantilla_cancelacion = COALESCE($1, configuracion_notificaciones.plantilla_cancelacion),
        plantilla_cambio_horario = COALESCE($2, configuracion_notificaciones.plantilla_cambio_horario),
        plantilla_aviso_libre = COALESCE($3, configuracion_notificaciones.plantilla_aviso_libre),
        actualizado_en = NOW()
       RETURNING *`,
      [plantilla_cancelacion, plantilla_cambio_horario, plantilla_aviso_libre, req.userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar plantillas de notificaciones" });
  }
});

// PUT /configuracion/whatsapp — upsert configuración de recordatorios WhatsApp
router.put("/whatsapp", async (req, res) => {
  const {
    recordatorios_activos,
    horas_anticipacion,
    mensaje_personalizado,
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO configuracion_notificaciones (usuario_id, recordatorios_activos, horas_anticipacion, mensaje_personalizado, actualizado_en)
       VALUES ($4, $1, $2, $3, NOW())
       ON CONFLICT (usuario_id) DO UPDATE SET
        recordatorios_activos = COALESCE($1, configuracion_notificaciones.recordatorios_activos),
        horas_anticipacion = COALESCE($2, configuracion_notificaciones.horas_anticipacion),
        mensaje_personalizado = COALESCE($3, configuracion_notificaciones.mensaje_personalizado),
        actualizado_en = NOW()
       RETURNING *`,
      [
        recordatorios_activos,
        horas_anticipacion,
        mensaje_personalizado,
        req.userId,
      ]
    );

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

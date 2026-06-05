import express from "express";
import pool from "../config/db.js";

const router = express.Router();

// GET / — Listar eventos del usuario, opcional ?estado=pendiente
router.get("/", async (req, res) => {
  const { estado } = req.query;
  try {
    const conditions = ["profesional_id = $1"];
    const params = [req.userId];
    let paramIndex = 1;

    if (estado) {
      params.push(estado);
      conditions.push(`estado = $${++paramIndex}`);
    }

    const result = await pool.query(
      `SELECT * FROM agenda_personal
       WHERE ${conditions.join(" AND ")}
       ORDER BY fecha_hora ASC`,
      params
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener eventos" });
  }
});

// POST / — Crear evento
router.post("/", async (req, res) => {
  const { titulo, descripcion, fecha_hora, recordatorio_minutos } = req.body;

  if (!titulo || !fecha_hora) {
    return res.status(400).json({ error: "Los campos titulo y fecha_hora son obligatorios" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO agenda_personal (profesional_id, titulo, descripcion, fecha_hora, recordatorio_minutos)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.userId, titulo, descripcion || null, fecha_hora, recordatorio_minutos || 30]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear evento" });
  }
});

// PUT /:id — Actualizar evento completo (solo propios)
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { titulo, descripcion, fecha_hora, recordatorio_minutos, estado } = req.body;

  try {
    const result = await pool.query(
      `UPDATE agenda_personal
       SET titulo = $1, descripcion = $2, fecha_hora = $3,
           recordatorio_minutos = $4, estado = $5
       WHERE id = $6 AND profesional_id = $7 RETURNING *`,
      [titulo, descripcion || null, fecha_hora, recordatorio_minutos, estado, id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Evento no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar evento" });
  }
});

// DELETE /:id — Eliminar evento (solo propios)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM agenda_personal WHERE id = $1 AND profesional_id = $2 RETURNING id",
      [id, req.userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "Evento no encontrado" });
    res.json({ message: "Evento eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar evento" });
  }
});

// PATCH /:id/completar — Marcar como completado (solo propios)
router.patch("/:id/completar", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE agenda_personal SET estado = 'completado'
       WHERE id = $1 AND profesional_id = $2 RETURNING *`,
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Evento no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al completar evento" });
  }
});

export default router;

import express from "express";
import pool from "../config/db.js";

const router = express.Router();

// Valores por defecto si no se pasan recordatorios
const RECORDATORIOS_DEFAULT = [1440, 30]; // 24h antes, 30 min antes

async function upsertRecordatorios(client, eventoId, minutosArray) {
  // Eliminar los existentes y reinsertar (más simple que hacer diff)
  await client.query(
    `DELETE FROM agenda_personal_recordatorios WHERE evento_id = $1`,
    [eventoId]
  );
  for (const minutos of minutosArray) {
    await client.query(
      `INSERT INTO agenda_personal_recordatorios (evento_id, minutos_antes) VALUES ($1, $2)`,
      [eventoId, minutos]
    );
  }
}

// GET / — Listar eventos con sus recordatorios
router.get("/", async (req, res) => {
  const { estado } = req.query;
  try {
    const conditions = ["ap.profesional_id = $1"];
    const params = [req.userId];
    let paramIndex = 1;

    if (estado) {
      params.push(estado);
      conditions.push(`ap.estado = $${++paramIndex}`);
    }

    const result = await pool.query(
      `SELECT ap.*,
              COALESCE(
                json_agg(apr.minutos_antes ORDER BY apr.minutos_antes DESC)
                FILTER (WHERE apr.id IS NOT NULL),
                '[]'
              ) AS recordatorios
       FROM agenda_personal ap
       LEFT JOIN agenda_personal_recordatorios apr ON apr.evento_id = ap.id
       WHERE ${conditions.join(" AND ")}
       GROUP BY ap.id
       ORDER BY ap.fecha_hora ASC`,
      params
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener eventos" });
  }
});

// POST / — Crear evento con recordatorios
router.post("/", async (req, res) => {
  const { titulo, descripcion, fecha_hora, recordatorios, recordatorio_minutos } = req.body;

  if (!titulo || !fecha_hora) {
    return res.status(400).json({ error: "Los campos titulo y fecha_hora son obligatorios" });
  }

  // Aceptar array nuevo o campo legacy
  const minutosArray = Array.isArray(recordatorios) && recordatorios.length > 0
    ? recordatorios
    : recordatorio_minutos
    ? [recordatorio_minutos]
    : RECORDATORIOS_DEFAULT;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO agenda_personal (profesional_id, titulo, descripcion, fecha_hora, recordatorio_minutos)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.userId, titulo, descripcion || null, fecha_hora, minutosArray[0] ?? 30]
    );

    const evento = result.rows[0];
    await upsertRecordatorios(client, evento.id, minutosArray);

    await client.query("COMMIT");

    evento.recordatorios = minutosArray;
    res.json(evento);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: "Error al crear evento" });
  } finally {
    client.release();
  }
});

// PUT /:id — Actualizar evento y sus recordatorios
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { titulo, descripcion, fecha_hora, recordatorio_minutos, estado, recordatorios } = req.body;

  const minutosArray = Array.isArray(recordatorios) && recordatorios.length > 0
    ? recordatorios
    : recordatorio_minutos
    ? [recordatorio_minutos]
    : null; // null = no cambiar recordatorios

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(
      `UPDATE agenda_personal
       SET titulo = $1, descripcion = $2, fecha_hora = $3,
           recordatorio_minutos = $4, estado = $5
       WHERE id = $6 AND profesional_id = $7 RETURNING *`,
      [titulo, descripcion || null, fecha_hora, minutosArray ? minutosArray[0] : recordatorio_minutos, estado, id, req.userId]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Evento no encontrado" });
    }

    if (minutosArray) {
      await upsertRecordatorios(client, id, minutosArray);
    }

    await client.query("COMMIT");

    const evento = result.rows[0];
    // Recargar recordatorios actuales
    const recResult = await pool.query(
      `SELECT minutos_antes FROM agenda_personal_recordatorios WHERE evento_id = $1 ORDER BY minutos_antes DESC`,
      [id]
    );
    evento.recordatorios = recResult.rows.map((r) => r.minutos_antes);

    res.json(evento);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: "Error al actualizar evento" });
  } finally {
    client.release();
  }
});

// DELETE /:id — Eliminar evento (cascada elimina recordatorios)
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

// PATCH /:id/completar — Marcar como completado
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

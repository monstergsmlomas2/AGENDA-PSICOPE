import express from "express";
import pool from "../config/db.js";

const router = express.Router();

// 1. LISTAR INFORMES (con filtro opcional por paciente_id)
router.get("/", async (req, res) => {
  const { paciente_id } = req.query;
  try {
    let query = `
      SELECT i.*, p.nombre AS paciente_nombre, p.apellido AS paciente_apellido
      FROM informes i
      JOIN pacientes p ON i.paciente_id = p.id
    `;
    const params = [];

    if (paciente_id) {
      query += " WHERE i.paciente_id = $1";
      params.push(paciente_id);
    }

    query += " ORDER BY i.fecha DESC, i.created_at DESC";
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener informes:", error);
    res.status(500).json({ error: "Error al obtener informes" });
  }
});

// 1b. INFORMES PRÓXIMOS A VENCER (30 días)
router.get("/proximos-vencer", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.*, p.nombre AS paciente_nombre, p.apellido AS paciente_apellido
      FROM informes i
      JOIN pacientes p ON i.paciente_id = p.id
      WHERE i.fecha_vencimiento IS NOT NULL
        AND i.fecha_vencimiento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
      ORDER BY i.fecha_vencimiento ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener informes próximos a vencer:", error);
    res.status(500).json({ error: "Error al obtener informes próximos a vencer" });
  }
});

// 2. OBTENER INFORME POR ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT i.*, p.nombre AS paciente_nombre, p.apellido AS paciente_apellido
       FROM informes i
       JOIN pacientes p ON i.paciente_id = p.id
       WHERE i.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Informe no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener informe:", error);
    res.status(500).json({ error: "Error al obtener informe" });
  }
});

// 3. CREAR INFORME
router.post("/", async (req, res) => {
  const { paciente_id, tipo, fecha, contenido, estado, fecha_vencimiento } = req.body;

  if (!paciente_id || !tipo || !fecha) {
    return res.status(400).json({ error: "Los campos paciente, tipo y fecha son obligatorios" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO informes (paciente_id, tipo, fecha, contenido, estado, fecha_vencimiento)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [paciente_id, tipo, fecha, JSON.stringify(contenido || {}), estado || 'borrador', fecha_vencimiento || null]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear informe:", error);
    res.status(500).json({ error: "Error al crear informe" });
  }
});

// 4. ACTUALIZAR INFORME
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { tipo, fecha, contenido, estado, fecha_vencimiento } = req.body;

  try {
    const result = await pool.query(
      `UPDATE informes SET tipo = $1, fecha = $2, contenido = $3, estado = $4, fecha_vencimiento = $5
       WHERE id = $6 RETURNING *`,
      [tipo, fecha, JSON.stringify(contenido || {}), estado, fecha_vencimiento || null, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Informe no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar informe:", error);
    res.status(500).json({ error: "Error al actualizar informe" });
  }
});

// 5. ELIMINAR INFORME
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM informes WHERE id = $1 RETURNING id", [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Informe no encontrado" });
    res.json({ message: "Informe eliminado" });
  } catch (error) {
    console.error("Error al eliminar informe:", error);
    res.status(500).json({ error: "Error al eliminar informe" });
  }
});

export default router;

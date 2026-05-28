import express from "express";
import pool from "../config/db.js";

const router = express.Router();

// 1. LISTAR EVALUACIONES (filtro opcional por paciente_id)
router.get("/", async (req, res) => {
  const { paciente_id } = req.query;
  try {
    let query = `
      SELECT e.*, p.nombre AS paciente_nombre, p.apellido AS paciente_apellido
      FROM evaluaciones e
      JOIN pacientes p ON e.paciente_id = p.id
    `;
    const conditions = ['p.usuario_id = $1'];
    const params = [req.userId];

    if (paciente_id) {
      conditions.push(`e.paciente_id = $${params.length + 1}`);
      params.push(paciente_id);
    }

    query += ` WHERE ${conditions.join(' AND ')}`;
    query += " ORDER BY e.fecha_administracion DESC, e.created_at DESC";
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener evaluaciones:", error);
    res.status(500).json({ error: "Error al obtener evaluaciones" });
  }
});

// 1b. EVALUACIONES PRÓXIMAS A VENCER
router.get("/proximos-vencer", async (req, res) => {
  res.json([]);
});

// 2. CREAR EVALUACIÓN
router.post("/", async (req, res) => {
  const { paciente_id, tipo_test, fecha_administracion, resultados, puntaje_obtenido, observaciones } = req.body;

  if (!paciente_id || !tipo_test) {
    return res.status(400).json({ error: "Los campos paciente y tipo de test son obligatorios" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO evaluaciones (paciente_id, tipo_test, fecha_administracion, resultados, puntaje_obtenido, observaciones, usuario_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [paciente_id, tipo_test, fecha_administracion, resultados, puntaje_obtenido, observaciones, req.userId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear evaluación:", error);
    res.status(500).json({ error: "Error al crear evaluación", detalle: error.message });
  }
});

// 3. ACTUALIZAR EVALUACIÓN
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { tipo_test, fecha_administracion, resultados, puntaje_obtenido, observaciones } = req.body;

  try {
    const result = await pool.query(
      `UPDATE evaluaciones e SET tipo_test = $1, fecha_administracion = $2, resultados = $3, puntaje_obtenido = $4, observaciones = $5
       FROM pacientes p
       WHERE e.id = $6 AND e.paciente_id = p.id AND p.usuario_id = $7
       RETURNING e.*`,
      [tipo_test, fecha_administracion, resultados, puntaje_obtenido, observaciones, id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Evaluación no encontrada" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar evaluación:", error);
    res.status(500).json({ error: "Error al actualizar evaluación" });
  }
});

// 4. ELIMINAR EVALUACIÓN
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `DELETE FROM evaluaciones e USING pacientes p
       WHERE e.id = $1 AND e.paciente_id = p.id AND p.usuario_id = $2
       RETURNING e.id`,
      [id, req.userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "Evaluación no encontrada" });
    res.json({ message: "Evaluación eliminada" });
  } catch (error) {
    console.error("Error al eliminar evaluación:", error);
    res.status(500).json({ error: "Error al eliminar evaluación" });
  }
});

export default router;

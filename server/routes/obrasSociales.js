import express from "express";
import pool from "../config/db.js";

const router = express.Router();

// 1. LISTAR OBRAS SOCIALES
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        os.*,
        COUNT(p.id) AS cantidad_pacientes
      FROM obras_sociales os
      LEFT JOIN pacientes p ON LOWER(p.obra_social) = LOWER(os.nombre)
      GROUP BY os.id
      ORDER BY os.nombre ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener obras sociales:", error);
    res.status(500).json({ error: "Error al obtener obras sociales" });
  }
});

// 1b. OBTENER OBRA SOCIAL POR ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT os.*,
        COUNT(p.id) AS cantidad_pacientes
       FROM obras_sociales os
       LEFT JOIN pacientes p ON LOWER(p.obra_social) = LOWER(os.nombre)
       WHERE os.id = $1
       GROUP BY os.id`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Obra social no encontrada" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener obra social:", error);
    res.status(500).json({ error: "Error al obtener obra social" });
  }
});

// 2. CREAR OBRA SOCIAL
router.post("/", async (req, res) => {
  const { nombre, codigo, sesiones_autorizadas, valor_sesion, periodo_renovacion, observaciones } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: "El nombre de la obra social es obligatorio" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO obras_sociales (nombre, codigo, sesiones_autorizadas, valor_sesion, periodo_renovacion, observaciones)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [nombre, codigo, sesiones_autorizadas || 4, valor_sesion, periodo_renovacion || 'mensual', observaciones]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear obra social:", error);
    res.status(500).json({ error: "Error al crear obra social" });
  }
});

// 3. ACTUALIZAR OBRA SOCIAL
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, codigo, sesiones_autorizadas, valor_sesion, periodo_renovacion, observaciones } = req.body;

  try {
    const result = await pool.query(
      `UPDATE obras_sociales SET nombre = $1, codigo = $2, sesiones_autorizadas = $3, valor_sesion = $4, periodo_renovacion = $5, observaciones = $6
       WHERE id = $7 RETURNING *`,
      [nombre, codigo, sesiones_autorizadas, valor_sesion, periodo_renovacion, observaciones, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Obra social no encontrada" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar obra social:", error);
    res.status(500).json({ error: "Error al actualizar obra social" });
  }
});

// 4. ELIMINAR OBRA SOCIAL
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM obras_sociales WHERE id = $1 RETURNING id", [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Obra social no encontrada" });
    res.json({ message: "Obra social eliminada" });
  } catch (error) {
    console.error("Error al eliminar obra social:", error);
    res.status(500).json({ error: "Error al eliminar obra social" });
  }
});

export default router;

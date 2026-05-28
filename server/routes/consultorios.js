import express from "express";
import pool from "../config/db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM consultorios WHERE usuario_id = $1 ORDER BY nombre ASC",
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener consultorios" });
  }
});

router.post("/", async (req, res) => {
  const { nombre, direccion, color } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: "El nombre del consultorio es obligatorio" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO consultorios (nombre, direccion, color, usuario_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [nombre, direccion, color || 'teal', req.userId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear consultorio:", error);
    res.status(500).json({ error: "Error al crear consultorio" });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM consultorios WHERE id = $1 AND usuario_id = $2 RETURNING id",
      [id, req.userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "Consultorio no encontrado" });
    res.json({ message: "Consultorio eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar consultorio" });
  }
});

export default router;

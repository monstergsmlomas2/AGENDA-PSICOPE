import express from "express";
import pool from "../config/db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM consultorios ORDER BY nombre ASC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener consultorios" });
  }
});

router.post("/", async (req, res) => {
  const { nombre, direccion, color } = req.body;

  // Validación de campos obligatorios
  if (!nombre) {
    return res.status(400).json({ error: "El nombre del consultorio es obligatorio" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO consultorios (nombre, direccion, color) VALUES ($1, $2, $3) RETURNING *",
      [nombre, direccion, color || 'teal']
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
    const result = await pool.query("DELETE FROM consultorios WHERE id = $1 RETURNING id", [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Consultorio no encontrado" });
    res.json({ message: "Consultorio eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar consultorio" });
  }
});

export default router;
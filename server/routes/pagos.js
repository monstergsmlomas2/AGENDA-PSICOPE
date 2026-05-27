import express from "express";
import pool from "../config/db.js";

const router = express.Router();

// 1. LISTAR PAGOS (con filtros opcionales)
router.get("/", async (req, res) => {
  const { paciente_id, mes, estado } = req.query;
  try {
    let query = `
      SELECT p.*, pa.nombre AS paciente_nombre, pa.apellido AS paciente_apellido
      FROM pagos p
      JOIN pacientes pa ON p.paciente_id = pa.id
    `;
    const params = [];
    const conditions = [];

    if (paciente_id) {
      conditions.push(`p.paciente_id = $${params.length + 1}`);
      params.push(paciente_id);
    }
    if (mes) {
      conditions.push(`to_char(p.fecha, 'YYYY-MM') = $${params.length + 1}`);
      params.push(mes);
    }
    if (estado) {
      conditions.push(`p.estado = $${params.length + 1}`);
      params.push(estado);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY p.fecha DESC, p.created_at DESC";
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener pagos:", error);
    res.status(500).json({ error: "Error al obtener pagos" });
  }
});

// 2. RESUMEN MENSUAL
router.get("/resumen-mes", async (req, res) => {
  const { mes } = req.query;
  const mesFiltro = mes || new Date().toISOString().slice(0, 7);

  try {
    const result = await pool.query(
      `SELECT 
        COUNT(*)::int AS total_pagos,
        COALESCE(SUM(CASE WHEN estado = 'pagado' THEN monto ELSE 0 END), 0) AS total_cobrado,
        COALESCE(SUM(CASE WHEN estado = 'pendiente' THEN monto ELSE 0 END), 0) AS total_pendiente,
        COALESCE(SUM(monto), 0) AS total_facturado
       FROM pagos
       WHERE to_char(fecha, 'YYYY-MM') = $1`,
      [mesFiltro]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener resumen mensual:", error);
    res.status(500).json({ error: "Error al obtener resumen mensual" });
  }
});

// 3. CREAR PAGO
router.post("/", async (req, res) => {
  const { paciente_id, fecha, concepto, monto, tipo_pago, estado, observaciones, nro_sesion_facturada } = req.body;

  if (!paciente_id || !fecha || !monto) {
    return res.status(400).json({ error: "Los campos paciente, fecha y monto son obligatorios" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO pagos (paciente_id, fecha, concepto, monto, tipo_pago, estado, observaciones, nro_sesion_facturada)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [paciente_id, fecha, concepto, monto, tipo_pago, estado || 'pendiente', observaciones, nro_sesion_facturada]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear pago:", error);
    res.status(500).json({ error: "Error al crear pago" });
  }
});

// 4. ACTUALIZAR PAGO
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { fecha, concepto, monto, tipo_pago, estado, observaciones, nro_sesion_facturada } = req.body;

  try {
    const result = await pool.query(
      `UPDATE pagos SET fecha = $1, concepto = $2, monto = $3, tipo_pago = $4, estado = $5, observaciones = $6, nro_sesion_facturada = $7
       WHERE id = $8 RETURNING *`,
      [fecha, concepto, monto, tipo_pago, estado, observaciones, nro_sesion_facturada, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Pago no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar pago:", error);
    res.status(500).json({ error: "Error al actualizar pago" });
  }
});

// 5. ELIMINAR PAGO
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM pagos WHERE id = $1 RETURNING id", [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Pago no encontrado" });
    res.json({ message: "Pago eliminado" });
  } catch (error) {
    console.error("Error al eliminar pago:", error);
    res.status(500).json({ error: "Error al eliminar pago" });
  }
});

export default router;

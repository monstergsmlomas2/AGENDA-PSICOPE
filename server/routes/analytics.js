import express from "express";
import pool from "../config/db.js";

const router = express.Router();

// ──────────────────────────────────────────────
// 1. INGRESOS MENSUALES (últimos 6 meses)
// ──────────────────────────────────────────────
router.get("/ingresos-mensuales", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        to_char(p.fecha, 'YYYY-MM') AS mes,
        COALESCE(SUM(p.monto), 0)::float AS ingresado,
        COALESCE(SUM(CASE WHEN p.estado = 'pagado' THEN p.monto ELSE 0 END), 0)::float AS cobrado
      FROM pagos p
      JOIN pacientes pa ON p.paciente_id = pa.id
      WHERE p.fecha >= date_trunc('month', NOW()) - INTERVAL '5 months'
        AND pa.usuario_id = $1
      GROUP BY mes
      ORDER BY mes ASC
    `, [req.userId]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener ingresos mensuales:", error);
    res.status(500).json({ error: "Error al obtener ingresos mensuales" });
  }
});

// ──────────────────────────────────────────────
// 2. SESIONES SEMANALES (últimos 7 días)
// ──────────────────────────────────────────────
router.get("/sesiones-semanales", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        to_char(t.fecha, 'YYYY-MM-DD') AS dia,
        COUNT(*)::int AS sesiones
      FROM turnos t
      JOIN pacientes p ON t.paciente_id = p.id
      WHERE t.fecha >= CURRENT_DATE - INTERVAL '6 days'
        AND t.estado != 'inasistencia'
        AND p.usuario_id = $1
      GROUP BY dia
      ORDER BY dia ASC
    `, [req.userId]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener sesiones semanales:", error);
    res.status(500).json({ error: "Error al obtener sesiones semanales" });
  }
});

// ──────────────────────────────────────────────
// 3. PACIENTES POR OBRA SOCIAL (top 5)
// ──────────────────────────────────────────────
router.get("/pacientes-por-obra-social", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COALESCE(NULLIF(obra_social, ''), 'Sin obra social') AS nombre,
        COUNT(*)::int AS cantidad
      FROM pacientes
      WHERE usuario_id = $1
      GROUP BY nombre
      ORDER BY cantidad DESC
      LIMIT 5
    `, [req.userId]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener pacientes por obra social:", error);
    res.status(500).json({ error: "Error al obtener pacientes por obra social" });
  }
});

// ──────────────────────────────────────────────
// 4. RESUMEN DEL MES ACTUAL
// ──────────────────────────────────────────────
router.get("/resumen-mes-actual", async (req, res) => {
  try {
    const result = await pool.query(`
      WITH
        resumen_sesiones AS (
          SELECT
            COALESCE(SUM(CASE WHEN s.fecha >= date_trunc('month', NOW()) THEN 1 ELSE 0 END), 0)::int AS sesiones_este_mes,
            COALESCE(SUM(CASE WHEN s.fecha >= date_trunc('month', NOW()) - INTERVAL '1 month'
                               AND s.fecha <  date_trunc('month', NOW()) THEN 1 ELSE 0 END), 0)::int AS sesiones_mes_anterior
          FROM sesiones s
          JOIN pacientes p ON s.paciente_id = p.id
          WHERE s.fecha >= date_trunc('month', NOW()) - INTERVAL '1 month'
            AND p.usuario_id = $1
        ),
        resumen_pagos AS (
          SELECT
            COALESCE(SUM(CASE WHEN p.fecha >= date_trunc('month', NOW()) THEN p.monto ELSE 0 END), 0)::float AS ingresos_este_mes,
            COALESCE(SUM(CASE WHEN p.fecha >= date_trunc('month', NOW()) - INTERVAL '1 month'
                               AND p.fecha <  date_trunc('month', NOW()) THEN p.monto ELSE 0 END), 0)::float AS ingresos_mes_anterior
          FROM pagos p
          JOIN pacientes pa ON p.paciente_id = pa.id
          WHERE p.fecha >= date_trunc('month', NOW()) - INTERVAL '1 month'
            AND pa.usuario_id = $1
        ),
        resumen_turnos AS (
          SELECT
            COUNT(DISTINCT CASE WHEN t.fecha >= date_trunc('month', NOW()) THEN t.paciente_id END)::int AS pacientes_activos,
            COALESCE(SUM(CASE WHEN t.fecha >= CURRENT_DATE AND t.estado = 'pendiente' THEN 1 ELSE 0 END), 0)::int AS turnos_pendientes
          FROM turnos t
          JOIN pacientes p ON t.paciente_id = p.id
          WHERE t.fecha >= date_trunc('month', NOW())
            AND p.usuario_id = $1
        )
      SELECT
        rs.sesiones_este_mes,
        rs.sesiones_mes_anterior,
        rp.ingresos_este_mes,
        rp.ingresos_mes_anterior,
        rt.pacientes_activos,
        rt.turnos_pendientes
      FROM resumen_sesiones rs, resumen_pagos rp, resumen_turnos rt
    `, [req.userId]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener resumen del mes:", error);
    res.status(500).json({ error: "Error al obtener resumen del mes" });
  }
});

export default router;

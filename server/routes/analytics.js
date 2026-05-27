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
        to_char(fecha, 'YYYY-MM') AS mes,
        COALESCE(SUM(monto), 0)::float AS ingresado,
        COALESCE(SUM(CASE WHEN estado = 'pagado' THEN monto ELSE 0 END), 0)::float AS cobrado
      FROM pagos
      WHERE fecha >= date_trunc('month', NOW()) - INTERVAL '5 months'
      GROUP BY mes
      ORDER BY mes ASC
    `);
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
        to_char(fecha, 'YYYY-MM-DD') AS dia,
        COUNT(*)::int AS sesiones
      FROM turnos
      WHERE fecha >= CURRENT_DATE - INTERVAL '6 days'
        AND estado != 'inasistencia'
      GROUP BY dia
      ORDER BY dia ASC
    `);
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
      GROUP BY nombre
      ORDER BY cantidad DESC
      LIMIT 5
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener pacientes por obra social:", error);
    res.status(500).json({ error: "Error al obtener pacientes por obra social" });
  }
});

// ──────────────────────────────────────────────
// 4. RESUMEN DEL MES ACTUAL (comparativa)
//    Optimizado: 1 sola query con CTEs separando sesiones (tabla correcta) de pagos
// ──────────────────────────────────────────────
router.get("/resumen-mes-actual", async (req, res) => {
  try {
    const result = await pool.query(`
      WITH
        resumen_sesiones AS (
          SELECT
            COALESCE(SUM(CASE WHEN fecha >= date_trunc('month', NOW()) THEN 1 ELSE 0 END), 0)::int AS sesiones_este_mes,
            COALESCE(SUM(CASE WHEN fecha >= date_trunc('month', NOW()) - INTERVAL '1 month'
                               AND fecha <  date_trunc('month', NOW()) THEN 1 ELSE 0 END), 0)::int AS sesiones_mes_anterior
          FROM sesiones
          WHERE fecha >= date_trunc('month', NOW()) - INTERVAL '1 month'
        ),
        resumen_pagos AS (
          SELECT
            COALESCE(SUM(CASE WHEN fecha >= date_trunc('month', NOW()) THEN monto ELSE 0 END), 0)::float AS ingresos_este_mes,
            COALESCE(SUM(CASE WHEN fecha >= date_trunc('month', NOW()) - INTERVAL '1 month'
                               AND fecha <  date_trunc('month', NOW()) THEN monto ELSE 0 END), 0)::float AS ingresos_mes_anterior
          FROM pagos
          WHERE fecha >= date_trunc('month', NOW()) - INTERVAL '1 month'
        ),
        resumen_turnos AS (
          SELECT
            COUNT(DISTINCT CASE WHEN fecha >= date_trunc('month', NOW()) THEN paciente_id END)::int AS pacientes_activos,
            COALESCE(SUM(CASE WHEN fecha >= CURRENT_DATE AND estado = 'pendiente' THEN 1 ELSE 0 END), 0)::int AS turnos_pendientes
          FROM turnos
          WHERE fecha >= date_trunc('month', NOW())
        )
      SELECT
        rs.sesiones_este_mes,
        rs.sesiones_mes_anterior,
        rp.ingresos_este_mes,
        rp.ingresos_mes_anterior,
        rt.pacientes_activos,
        rt.turnos_pendientes
      FROM resumen_sesiones rs, resumen_pagos rp, resumen_turnos rt
    `);

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener resumen del mes:", error);
    res.status(500).json({ error: "Error al obtener resumen del mes" });
  }
});

export default router;

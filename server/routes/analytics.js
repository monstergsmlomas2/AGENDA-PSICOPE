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
//    Cuenta turnos realizados (excluye inasistencia y cancelado)
//    Genera una fila por día incluso si no hay turnos
// ──────────────────────────────────────────────
router.get("/sesiones-semanales", async (req, res) => {
  try {
    const result = await pool.query(`
      WITH dias AS (
        SELECT generate_series(
          CURRENT_DATE - INTERVAL '6 days',
          CURRENT_DATE,
          '1 day'::interval
        )::date AS dia
      )
      SELECT
        to_char(d.dia, 'YYYY-MM-DD') AS dia,
        COUNT(t.id)::int AS sesiones
      FROM dias d
      LEFT JOIN turnos t
        ON t.fecha = d.dia
        AND t.estado NOT IN ('inasistencia', 'cancelado')
        AND t.usuario_id = $1
      GROUP BY d.dia
      ORDER BY d.dia ASC
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
        COALESCE(NULLIF(TRIM(obra_social), ''), 'Sin obra social') AS nombre,
        COUNT(*)::int AS cantidad
      FROM pacientes
      WHERE usuario_id = $1
      GROUP BY COALESCE(NULLIF(TRIM(obra_social), ''), 'Sin obra social')
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
//    - sesiones_este_mes / sesiones_mes_anterior: turnos realizados (no cancelado/inasistencia)
//    - ingresos: desde tabla pagos
//    - pacientes_activos: pacientes con al menos un turno este mes
//    - turnos_pendientes: turnos con estado 'pendiente' desde hoy en adelante
// ──────────────────────────────────────────────
router.get("/resumen-mes-actual", async (req, res) => {
  try {
    const result = await pool.query(`
      WITH
        resumen_sesiones AS (
          SELECT
            COALESCE(SUM(CASE
              WHEN t.fecha >= date_trunc('month', NOW())
              AND t.estado NOT IN ('inasistencia', 'cancelado')
              THEN 1 ELSE 0 END), 0)::int AS sesiones_este_mes,
            COALESCE(SUM(CASE
              WHEN t.fecha >= date_trunc('month', NOW()) - INTERVAL '1 month'
              AND t.fecha <  date_trunc('month', NOW())
              AND t.estado NOT IN ('inasistencia', 'cancelado')
              THEN 1 ELSE 0 END), 0)::int AS sesiones_mes_anterior
          FROM turnos t
          JOIN pacientes p ON t.paciente_id = p.id
          WHERE t.fecha >= date_trunc('month', NOW()) - INTERVAL '1 month'
            AND p.usuario_id = $1
        ),
        resumen_pagos AS (
          SELECT
            COALESCE(SUM(CASE WHEN p.fecha >= date_trunc('month', NOW()) THEN p.monto ELSE 0 END), 0)::float AS ingresos_este_mes,
            COALESCE(SUM(CASE
              WHEN p.fecha >= date_trunc('month', NOW()) - INTERVAL '1 month'
              AND p.fecha <  date_trunc('month', NOW())
              THEN p.monto ELSE 0 END), 0)::float AS ingresos_mes_anterior
          FROM pagos p
          JOIN pacientes pa ON p.paciente_id = pa.id
          WHERE p.fecha >= date_trunc('month', NOW()) - INTERVAL '1 month'
            AND pa.usuario_id = $1
        ),
        resumen_turnos AS (
          SELECT
            COUNT(DISTINCT CASE
              WHEN t.fecha >= date_trunc('month', NOW())
              AND t.fecha <= CURRENT_DATE
              THEN t.paciente_id END)::int AS pacientes_activos,
            COALESCE(SUM(CASE
              WHEN t.fecha >= CURRENT_DATE
              AND t.estado = 'pendiente'
              THEN 1 ELSE 0 END), 0)::int AS turnos_pendientes
          FROM turnos t
          JOIN pacientes p ON t.paciente_id = p.id
          WHERE p.usuario_id = $1
            AND t.fecha >= date_trunc('month', NOW())
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

// ──────────────────────────────────────────────
// 5. TOTALES GLOBALES (para KPI cards)
// ──────────────────────────────────────────────
router.get("/totales", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*)::int AS total_turnos,
        COUNT(*) FILTER (
          WHERE estado = 'inasistencia' AND fecha >= date_trunc('month', NOW())
        )::int AS ausentes_mes
      FROM turnos
      WHERE usuario_id = $1
    `, [req.userId]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener totales:", error);
    res.status(500).json({ error: "Error al obtener totales" });
  }
});

export default router;

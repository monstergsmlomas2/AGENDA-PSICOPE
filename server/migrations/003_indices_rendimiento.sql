-- ============================================================
-- Migración 003: Índices para optimizar rendimiento de queries
-- ============================================================
-- Fecha: 2026-05-26
-- Ejecutado en Supabase: 2026-05-26
-- Descripción: Crea índices en las columnas más consultadas
-- para reducir el escaneo secuencial (seq scan) en las tablas
-- turnos y pagos.
--
-- Cómo ejecutar: Pegar este script en Supabase SQL Editor
-- (Table Editor → SQL) y ejecutar.
-- ============================================================

-- Turnos: filtros por fecha (usados en dashboard, turnos del día, resumen mensual)
CREATE INDEX IF NOT EXISTS idx_turnos_fecha ON turnos(fecha);

-- Turnos: filtros por paciente (historial del paciente, sesiones sin visita)
CREATE INDEX IF NOT EXISTS idx_turnos_paciente_id ON turnos(paciente_id);

-- Pagos: filtros por fecha (ingresos mensuales, resumen del mes)
CREATE INDEX IF NOT EXISTS idx_pagos_fecha ON pagos(fecha);

-- Pagos: filtros por estado (pagos pendientes / deuda)
CREATE INDEX IF NOT EXISTS idx_pagos_estado ON pagos(estado);

-- Sesiones: filtros por fecha (resumen del mes, sin-sesion-reciente)
CREATE INDEX IF NOT EXISTS idx_sesiones_fecha ON sesiones(fecha);

-- Sesiones: filtros por paciente (historial de sesiones por paciente)
CREATE INDEX IF NOT EXISTS idx_sesiones_paciente_id ON sesiones(paciente_id);

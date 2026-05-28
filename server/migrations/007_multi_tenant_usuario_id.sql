-- ============================================================
-- Migración 007: Multi-tenant — Columna usuario_id
-- ============================================================
-- Agrega la columna usuario_id (UUID) a todas las tablas
-- principales para filtrar datos por profesional.
--
-- La columna es NULLABLE al principio para no romver datos
-- existentes. Después de ejecutar esta migración, hay que
-- hacer un UPDATE manual para asignar los datos existentes
-- a un usuario específico (ver script de asignación).
--
-- Una vez asignados todos los datos, se debe cambiar la
-- columna a NOT NULL.
-- ============================================================

-- ============================================================
-- 1. pacientes
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pacientes' AND column_name = 'usuario_id'
  ) THEN
    ALTER TABLE pacientes ADD COLUMN usuario_id UUID;
    COMMENT ON COLUMN pacientes.usuario_id IS 'UUID del usuario (Supabase Auth) al que pertenece este paciente';
  END IF;
END $$;

-- ============================================================
-- 2. turnos
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'turnos' AND column_name = 'usuario_id'
  ) THEN
    ALTER TABLE turnos ADD COLUMN usuario_id UUID;
    COMMENT ON COLUMN turnos.usuario_id IS 'UUID del usuario (Supabase Auth) al que pertenece este turno';
  END IF;
END $$;

-- ============================================================
-- 3. sesiones
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sesiones' AND column_name = 'usuario_id'
  ) THEN
    ALTER TABLE sesiones ADD COLUMN usuario_id UUID;
    COMMENT ON COLUMN sesiones.usuario_id IS 'UUID del usuario (Supabase Auth) al que pertenece esta sesión';
  END IF;
END $$;

-- ============================================================
-- 4. evaluaciones
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'evaluaciones' AND column_name = 'usuario_id'
  ) THEN
    ALTER TABLE evaluaciones ADD COLUMN usuario_id UUID;
    COMMENT ON COLUMN evaluaciones.usuario_id IS 'UUID del usuario (Supabase Auth) al que pertenece esta evaluación';
  END IF;
END $$;

-- ============================================================
-- 5. pagos
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pagos' AND column_name = 'usuario_id'
  ) THEN
    ALTER TABLE pagos ADD COLUMN usuario_id UUID;
    COMMENT ON COLUMN pagos.usuario_id IS 'UUID del usuario (Supabase Auth) al que pertenece este pago';
  END IF;
END $$;

-- ============================================================
-- 6. informes
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'informes' AND column_name = 'usuario_id'
  ) THEN
    ALTER TABLE informes ADD COLUMN usuario_id UUID;
    COMMENT ON COLUMN informes.usuario_id IS 'UUID del usuario (Supabase Auth) al que pertenece este informe';
  END IF;
END $$;

-- ============================================================
-- 7. consultorios
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'consultorios' AND column_name = 'usuario_id'
  ) THEN
    ALTER TABLE consultorios ADD COLUMN usuario_id UUID;
    COMMENT ON COLUMN consultorios.usuario_id IS 'UUID del usuario (Supabase Auth) al que pertenece este consultorio';
  END IF;
END $$;

-- ============================================================
-- 8. obras_sociales
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'obras_sociales' AND column_name = 'usuario_id'
  ) THEN
    ALTER TABLE obras_sociales ADD COLUMN usuario_id UUID;
    COMMENT ON COLUMN obras_sociales.usuario_id IS 'UUID del usuario (Supabase Auth) al que pertenece esta obra social';
  END IF;
END $$;

-- ============================================================
-- 9. configuracion_notificaciones
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'configuracion_notificaciones' AND column_name = 'usuario_id'
  ) THEN
    ALTER TABLE configuracion_notificaciones ADD COLUMN usuario_id UUID;
    COMMENT ON COLUMN configuracion_notificaciones.usuario_id IS 'UUID del usuario (Supabase Auth) al que pertenece esta configuración';
  END IF;
END $$;

-- ============================================================
-- 10. notificaciones (si existe)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'notificaciones'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'notificaciones' AND column_name = 'usuario_id'
    ) THEN
      ALTER TABLE notificaciones ADD COLUMN usuario_id UUID;
      COMMENT ON COLUMN notificaciones.usuario_id IS 'UUID del usuario (Supabase Auth) al que pertenece esta notificación';
    END IF;
  END IF;
END $$;

-- ============================================================
-- ÍNDICES — para filtrar rápido por usuario_id
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_pacientes_usuario_id ON pacientes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_turnos_usuario_id ON turnos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_usuario_id ON sesiones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_usuario_id ON evaluaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pagos_usuario_id ON pagos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_informes_usuario_id ON informes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_consultorios_usuario_id ON consultorios(usuario_id);
CREATE INDEX IF NOT EXISTS idx_obras_sociales_usuario_id ON obras_sociales(usuario_id);
CREATE INDEX IF NOT EXISTS idx_config_notificaciones_usuario_id ON configuracion_notificaciones(usuario_id);

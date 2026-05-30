-- ============================================================
-- Migración 010: Recordatorios WhatsApp — configuración + log
-- ============================================================
-- Agrega columnas para la sección "Recordatorios por WhatsApp"
-- a configuracion_notificaciones y crea la tabla recordatorios_log
-- para el historial de envíos.
-- ============================================================

-- ============================================================
-- 1. Nuevas columnas en configuracion_notificaciones
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'configuracion_notificaciones' AND column_name = 'recordatorios_activos'
  ) THEN
    ALTER TABLE configuracion_notificaciones ADD COLUMN recordatorios_activos BOOLEAN DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'configuracion_notificaciones' AND column_name = 'horas_anticipacion'
  ) THEN
    ALTER TABLE configuracion_notificaciones ADD COLUMN horas_anticipacion INTEGER DEFAULT 24;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'configuracion_notificaciones' AND column_name = 'mensaje_personalizado'
  ) THEN
    ALTER TABLE configuracion_notificaciones ADD COLUMN mensaje_personalizado TEXT;
  END IF;
END $$;

-- ============================================================
-- 2. Tabla recordatorios_log — historial de envíos
-- ============================================================
CREATE TABLE IF NOT EXISTS recordatorios_log (
  id SERIAL PRIMARY KEY,
  paciente_id INTEGER,
  paciente_nombre TEXT,
  enviado_at TIMESTAMPTZ DEFAULT NOW(),
  estado TEXT DEFAULT 'enviado',
  usuario_id UUID
);

-- Índice para filtrar rápido por usuario y ordenar por fecha
CREATE INDEX IF NOT EXISTS idx_recordatorios_log_usuario_id ON recordatorios_log(usuario_id);
CREATE INDEX IF NOT EXISTS idx_recordatorios_log_enviado_at ON recordatorios_log(enviado_at DESC);

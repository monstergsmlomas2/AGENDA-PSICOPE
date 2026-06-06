-- Migración 021: Sincronización con Google Calendar
-- Agrega columna para guardar el ID del evento creado en Google Calendar
-- y tabla de configuración de Calendar por usuario

ALTER TABLE turnos
  ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT;

-- Tabla para guardar la configuración de sincronización de Calendar por usuario
CREATE TABLE IF NOT EXISTS google_calendar_config (
  id SERIAL PRIMARY KEY,
  usuario_id TEXT NOT NULL UNIQUE,
  calendar_id TEXT NOT NULL DEFAULT 'primary',  -- ID del calendario de destino
  sync_enabled BOOLEAN NOT NULL DEFAULT true,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

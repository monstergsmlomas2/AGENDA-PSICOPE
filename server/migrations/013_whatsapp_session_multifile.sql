-- Migración: adaptar whatsapp_session para guardar múltiples archivos de Baileys
-- Baileys necesita creds.json + app-state-*.json para mantener sesión en filesystem efímero (Render)

-- Si la tabla existe con esquema viejo (columnas id + session_data), la adaptamos
DO $$
BEGIN
  -- Agregar columnas nuevas si no existen
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='whatsapp_session' AND column_name='filename') THEN
    ALTER TABLE whatsapp_session ADD COLUMN filename TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='whatsapp_session' AND column_name='file_data') THEN
    ALTER TABLE whatsapp_session ADD COLUMN file_data TEXT;
  END IF;

  -- Migrar datos viejos (creds.json) al nuevo esquema
  UPDATE whatsapp_session SET filename = id, file_data = session_data WHERE filename IS NULL AND session_data IS NOT NULL;
END $$;

-- Crear tabla nueva si no existía en absoluto
CREATE TABLE IF NOT EXISTS whatsapp_session (
  filename TEXT PRIMARY KEY,
  file_data TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

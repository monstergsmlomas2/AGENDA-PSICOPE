-- Corrige la tabla whatsapp_session para que funcione con el esquema de multifile (Baileys)
-- El error "null value in column session_data" ocurre porque la columna vieja tiene NOT NULL

-- 1. Hacer que session_data acepte NULL (columna legacy, ya no se usa)
ALTER TABLE whatsapp_session ALTER COLUMN session_data DROP NOT NULL;

-- 2. Asegurarse de que las columnas nuevas existan
ALTER TABLE whatsapp_session ADD COLUMN IF NOT EXISTS filename TEXT;
ALTER TABLE whatsapp_session ADD COLUMN IF NOT EXISTS file_data TEXT;

-- 3. Si filename no es la PK todavía, migrarlo
-- (ignorar el error si ya está configurado así)
DO $$
BEGIN
  -- Solo migrar si hay filas viejas sin filename
  UPDATE whatsapp_session SET filename = id::text WHERE filename IS NULL AND id IS NOT NULL;
EXCEPTION WHEN OTHERS THEN
  NULL;
END$$;

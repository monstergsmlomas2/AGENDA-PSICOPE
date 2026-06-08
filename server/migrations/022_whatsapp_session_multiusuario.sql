-- Migra whatsapp_session de sesión única global a sesión por usuario.
-- Antes: PK (filename), con fila especial filename='__owner__' guardando el usuario dueño.
-- Ahora: PK (usuario_id, filename) — cada usuario tiene su propia sesión de WhatsApp aislada.

ALTER TABLE whatsapp_session ADD COLUMN IF NOT EXISTS usuario_id UUID;

-- Asignar los archivos de sesión existentes al usuario que figuraba como dueño
-- (fila '__owner__' guardaba su id en file_data). Si no existe esa fila, los
-- archivos quedan sin usuario_id y se descartan más abajo (fuerza nuevo QR).
DO $$
BEGIN
  UPDATE whatsapp_session
  SET usuario_id = (SELECT file_data::uuid FROM whatsapp_session WHERE filename = '__owner__' LIMIT 1)
  WHERE usuario_id IS NULL AND filename <> '__owner__';
EXCEPTION WHEN OTHERS THEN
  NULL;
END$$;

DELETE FROM whatsapp_session WHERE filename = '__owner__';
DELETE FROM whatsapp_session WHERE usuario_id IS NULL;

ALTER TABLE whatsapp_session DROP CONSTRAINT IF EXISTS whatsapp_session_pkey;
ALTER TABLE whatsapp_session ALTER COLUMN usuario_id SET NOT NULL;

DO $$
BEGIN
  ALTER TABLE whatsapp_session ADD CONSTRAINT whatsapp_session_pkey PRIMARY KEY (usuario_id, filename);
EXCEPTION WHEN OTHERS THEN
  NULL;
END$$;

CREATE INDEX IF NOT EXISTS idx_whatsapp_session_usuario ON whatsapp_session(usuario_id);

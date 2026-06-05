-- Agrega columna origen a agenda_personal para identificar eventos creados via WhatsApp propio
ALTER TABLE agenda_personal
  ADD COLUMN IF NOT EXISTS origen TEXT NOT NULL DEFAULT 'manual';

-- 'manual'    → creado desde la UI
-- 'whatsapp'  → detectado por IA desde mensaje propio

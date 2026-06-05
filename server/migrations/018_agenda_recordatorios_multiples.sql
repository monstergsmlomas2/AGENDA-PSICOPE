-- Reemplaza el campo único recordatorio_minutos por una tabla de recordatorios
-- que permite múltiples recordatorios por evento, cada uno con su propio estado.

CREATE TABLE IF NOT EXISTS agenda_personal_recordatorios (
  id              SERIAL PRIMARY KEY,
  evento_id       UUID NOT NULL REFERENCES agenda_personal(id) ON DELETE CASCADE,
  minutos_antes   INTEGER NOT NULL DEFAULT 30,  -- ej: 1440 = 24h, 30 = 30 min
  enviado         BOOLEAN NOT NULL DEFAULT false,
  enviado_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apr_evento_id ON agenda_personal_recordatorios(evento_id);
CREATE INDEX IF NOT EXISTS idx_apr_pendientes ON agenda_personal_recordatorios(enviado) WHERE enviado = false;

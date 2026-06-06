-- Versionado de informes
-- Cada vez que se edita un informe existente, el contenido anterior se guarda aquí

CREATE TABLE IF NOT EXISTS informes_versiones (
  id SERIAL PRIMARY KEY,
  informe_id INTEGER NOT NULL REFERENCES informes(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  tipo VARCHAR(100),
  fecha DATE,
  contenido JSONB,
  estado VARCHAR(50),
  guardado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_informes_versiones_informe_id ON informes_versiones(informe_id);

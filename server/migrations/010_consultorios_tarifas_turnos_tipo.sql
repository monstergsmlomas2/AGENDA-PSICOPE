-- Tarifas en consultorios
ALTER TABLE consultorios
  ADD COLUMN IF NOT EXISTS monto_tratamiento NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS monto_evaluacion  NUMERIC(10,2);

-- Tipo de turno e importe custom en turnos
ALTER TABLE turnos
  ADD COLUMN IF NOT EXISTS tipo_turno    VARCHAR(20) DEFAULT 'tratamiento',
  ADD COLUMN IF NOT EXISTS importe_custom NUMERIC(10,2);

-- Referencia al turno origen en pagos (para vincular caja)
ALTER TABLE pagos
  ADD COLUMN IF NOT EXISTS turno_id INTEGER REFERENCES turnos(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pagos_turno_id ON pagos(turno_id);

CREATE TABLE IF NOT EXISTS notificaciones (
  id SERIAL PRIMARY KEY,
  turno_id INTEGER REFERENCES turnos(id) ON DELETE SET NULL,
  paciente_id INTEGER REFERENCES pacientes(id) ON DELETE SET NULL,
  telefono VARCHAR(50),
  mensaje TEXT,
  tipo VARCHAR(50), -- 'recordatorio_turno' | 'seguimiento_paciente'
  estado VARCHAR(20) DEFAULT 'enviado', -- 'enviado' | 'error'
  error_detalle TEXT,
  enviado_en TIMESTAMPTZ DEFAULT NOW()
);

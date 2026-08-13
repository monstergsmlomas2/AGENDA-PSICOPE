-- ============================================================
-- Migración 024: Historial del Asistente Clínico (Panel de IA)
-- ============================================================
-- Hasta ahora el chat del asistente vivía solo en memoria del
-- navegador: al cambiar de pestaña, recargar o entrar desde otro
-- dispositivo se perdía todo lo conversado sobre un paciente.
--
-- Estas dos tablas persisten las conversaciones por usuario y por
-- paciente. Un paciente puede tener varias conversaciones
-- (hilos) independientes.
--
-- paciente_id NULL = consulta general (sin paciente seleccionado).
-- ============================================================

-- ============================================================
-- 1. Conversaciones (hilos)
-- ============================================================
CREATE TABLE IF NOT EXISTS ia_conversaciones (
  id SERIAL PRIMARY KEY,
  usuario_id UUID NOT NULL,
  paciente_id INTEGER REFERENCES pacientes(id) ON DELETE CASCADE,
  titulo VARCHAR(120) NOT NULL DEFAULT 'Nueva conversación',
  creada_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizada_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE ia_conversaciones IS 'Hilos de conversación del Asistente Clínico del Panel de IA';
COMMENT ON COLUMN ia_conversaciones.paciente_id IS 'Paciente sobre el que trata el hilo. NULL = consulta general sin contexto de paciente';
COMMENT ON COLUMN ia_conversaciones.titulo IS 'Se genera con el primer mensaje del profesional; se puede renombrar';
COMMENT ON COLUMN ia_conversaciones.actualizada_en IS 'Fecha del último mensaje — se usa para ordenar la lista de hilos';

-- ============================================================
-- 2. Mensajes de cada conversación
-- ============================================================
CREATE TABLE IF NOT EXISTS ia_mensajes (
  id SERIAL PRIMARY KEY,
  conversacion_id INTEGER NOT NULL REFERENCES ia_conversaciones(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE ia_mensajes IS 'Mensajes individuales de cada hilo del Asistente Clínico';
COMMENT ON COLUMN ia_mensajes.role IS 'user = profesional, assistant = IA';

-- ============================================================
-- ÍNDICES
-- ============================================================

-- Listado de hilos del usuario, ordenado por actividad reciente
CREATE INDEX IF NOT EXISTS idx_ia_conversaciones_usuario
  ON ia_conversaciones(usuario_id, actualizada_en DESC);

-- Listado de hilos de un paciente puntual
CREATE INDEX IF NOT EXISTS idx_ia_conversaciones_paciente
  ON ia_conversaciones(usuario_id, paciente_id, actualizada_en DESC);

-- Carga de los mensajes de un hilo en orden cronológico
CREATE INDEX IF NOT EXISTS idx_ia_mensajes_conversacion
  ON ia_mensajes(conversacion_id, creado_en ASC);

-- Migración: Agregar/modificar columna estado en tabla turnos
-- Valores válidos: pendiente, confirmado, inasistencia
-- Default: pendiente

-- Si la columna ya existe pero con CHECK constraint, la eliminamos primero
ALTER TABLE turnos DROP CONSTRAINT IF EXISTS turnos_estado_check;

-- Si la columna no existe, la agregamos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'turnos' AND column_name = 'estado'
  ) THEN
    ALTER TABLE turnos ADD COLUMN estado VARCHAR(20) NOT NULL DEFAULT 'pendiente';
  END IF;
END $$;

-- Actualizar registros existentes: mapear estados viejos a nuevos
UPDATE turnos SET estado = 'confirmado' WHERE estado IN ('realizado', 'completado');
UPDATE turnos SET estado = 'inasistencia' WHERE estado IN ('ausente', 'cancelado', 'no_asistio');

-- Agregar CHECK constraint con los valores permitidos
ALTER TABLE turnos ADD CONSTRAINT turnos_estado_check
  CHECK (estado IN ('pendiente', 'confirmado', 'inasistencia'));

-- Asegurar default
ALTER TABLE turnos ALTER COLUMN estado SET DEFAULT 'pendiente';

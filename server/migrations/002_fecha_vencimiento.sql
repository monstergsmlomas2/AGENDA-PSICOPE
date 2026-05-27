-- Migración: Agregar columna fecha_vencimiento a tablas informes y evaluaciones

-- tabla: informes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'informes' AND column_name = 'fecha_vencimiento'
  ) THEN
    ALTER TABLE informes ADD COLUMN fecha_vencimiento DATE;
  END IF;
END $$;

-- tabla: evaluaciones
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'evaluaciones' AND column_name = 'fecha_vencimiento'
  ) THEN
    ALTER TABLE evaluaciones ADD COLUMN fecha_vencimiento DATE;
  END IF;
END $$;

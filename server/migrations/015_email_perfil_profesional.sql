-- Migración 015: Asegurar columna email en configuracion_notificaciones
-- Esta migración es idempotente — se puede correr varias veces sin error.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'configuracion_notificaciones' AND column_name = 'email'
  ) THEN
    ALTER TABLE configuracion_notificaciones ADD COLUMN email VARCHAR(255);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'configuracion_notificaciones' AND column_name = 'nombre_profesional'
  ) THEN
    ALTER TABLE configuracion_notificaciones ADD COLUMN nombre_profesional VARCHAR(255);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'configuracion_notificaciones' AND column_name = 'especialidad'
  ) THEN
    ALTER TABLE configuracion_notificaciones ADD COLUMN especialidad VARCHAR(255);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'configuracion_notificaciones' AND column_name = 'matricula'
  ) THEN
    ALTER TABLE configuracion_notificaciones ADD COLUMN matricula VARCHAR(100);
  END IF;
END $$;

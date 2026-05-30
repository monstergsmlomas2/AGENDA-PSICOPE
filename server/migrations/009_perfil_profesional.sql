-- ============================================================
-- Migración 009: Perfil profesional — columnas para recibos PDF
-- ============================================================
-- Agrega las columnas de perfil profesional a la tabla
-- configuracion_notificaciones para usarlas en los recibos PDF.
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'configuracion_notificaciones' AND column_name = 'nombre_profesional'
  ) THEN
    ALTER TABLE configuracion_notificaciones ADD COLUMN nombre_profesional VARCHAR(255);
    COMMENT ON COLUMN configuracion_notificaciones.nombre_profesional IS 'Nombre completo del profesional para recibos';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'configuracion_notificaciones' AND column_name = 'especialidad'
  ) THEN
    ALTER TABLE configuracion_notificaciones ADD COLUMN especialidad VARCHAR(255);
    COMMENT ON COLUMN configuracion_notificaciones.especialidad IS 'Especialidad del profesional';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'configuracion_notificaciones' AND column_name = 'matricula'
  ) THEN
    ALTER TABLE configuracion_notificaciones ADD COLUMN matricula VARCHAR(100);
    COMMENT ON COLUMN configuracion_notificaciones.matricula IS 'Matrícula / número de colegiado';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'configuracion_notificaciones' AND column_name = 'email'
  ) THEN
    ALTER TABLE configuracion_notificaciones ADD COLUMN email VARCHAR(255);
    COMMENT ON COLUMN configuracion_notificaciones.email IS 'Email de contacto del profesional';
  END IF;
END $$;

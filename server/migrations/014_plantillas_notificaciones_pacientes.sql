-- ============================================================
-- Migración 014: Plantillas de notificaciones a pacientes
-- ============================================================
-- Agrega columnas para las plantillas de avisos puntuales
-- (cancelación, cambio de horario, aviso libre) a la tabla
-- configuracion_notificaciones.
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'configuracion_notificaciones' AND column_name = 'plantilla_cancelacion'
  ) THEN
    ALTER TABLE configuracion_notificaciones ADD COLUMN plantilla_cancelacion TEXT DEFAULT 'Hola {nombre}, te informamos que tu turno del {fecha} a las {hora} ha sido cancelado. Comunicate con nosotros para reprogramarlo.';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'configuracion_notificaciones' AND column_name = 'plantilla_cambio_horario'
  ) THEN
    ALTER TABLE configuracion_notificaciones ADD COLUMN plantilla_cambio_horario TEXT DEFAULT 'Hola {nombre}, te avisamos que tu turno fue reprogramado para el {fecha} a las {hora} en {consultorio}. Ante cualquier consulta, comunicate con nosotros.';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'configuracion_notificaciones' AND column_name = 'plantilla_aviso_libre'
  ) THEN
    ALTER TABLE configuracion_notificaciones ADD COLUMN plantilla_aviso_libre TEXT DEFAULT 'Hola {nombre}, te enviamos este mensaje desde el consultorio. Ante cualquier consulta, comunicate con nosotros.';
  END IF;
END $$;

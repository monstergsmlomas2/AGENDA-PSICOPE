-- ============================================================
-- Script de asignación de datos existentes a un usuario
-- ============================================================
-- IMPORTANTE: Este script NO se ejecuta automáticamente.
-- Ejecutalo MANUALMENTE después de:
--   1. Crear el usuario en Supabase Auth Dashboard
--   2. Reemplazar 'TU_UUID_AQUI' por el UUID del usuario
--   3. Ejecutar la migración 007 primero
--
-- Para obtener el UUID del usuario:
--   En Supabase Dashboard → Authentication → Users
--   Copiar el UUID del usuario (columna "User UID")
-- ============================================================

-- Reemplazá este valor por el UUID de tu usuario en Supabase
-- Ejemplo: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
DO $$
DECLARE
  target_usuario_id UUID := 'TU_UUID_AQUI';
BEGIN
  IF target_usuario_id = 'TU_UUID_AQUI' THEN
    RAISE EXCEPTION '❌ Debés reemplazar TU_UUID_AQUI por el UUID real del usuario en Supabase';
  END IF;

  -- Asignar pacientes
  UPDATE pacientes SET usuario_id = target_usuario_id WHERE usuario_id IS NULL;
  RAISE NOTICE '✅ pacientes actualizados';

  -- Asignar turnos
  UPDATE turnos SET usuario_id = target_usuario_id WHERE usuario_id IS NULL;
  RAISE NOTICE '✅ turnos actualizados';

  -- Asignar sesiones (vinculadas a pacientes del usuario)
  UPDATE sesiones s SET usuario_id = p.usuario_id
  FROM pacientes p
  WHERE s.paciente_id = p.id AND s.usuario_id IS NULL;
  RAISE NOTICE '✅ sesiones actualizadas';

  -- Asignar evaluaciones (vinculadas a pacientes del usuario)
  UPDATE evaluaciones e SET usuario_id = p.usuario_id
  FROM pacientes p
  WHERE e.paciente_id = p.id AND e.usuario_id IS NULL;
  RAISE NOTICE '✅ evaluaciones actualizadas';

  -- Asignar pagos (vinculados a pacientes del usuario)
  UPDATE pagos p SET usuario_id = pa.usuario_id
  FROM pacientes pa
  WHERE p.paciente_id = pa.id AND p.usuario_id IS NULL;
  RAISE NOTICE '✅ pagos actualizados';

  -- Asignar informes (vinculados a pacientes del usuario)
  UPDATE informes i SET usuario_id = p.usuario_id
  FROM pacientes p
  WHERE i.paciente_id = p.id AND i.usuario_id IS NULL;
  RAISE NOTICE '✅ informes actualizados';

  -- Asignar consultorios
  UPDATE consultorios SET usuario_id = target_usuario_id WHERE usuario_id IS NULL;
  RAISE NOTICE '✅ consultorios actualizados';

  -- Asignar obras sociales
  UPDATE obras_sociales SET usuario_id = target_usuario_id WHERE usuario_id IS NULL;
  RAISE NOTICE '✅ obras_sociales actualizados';

  -- Asignar configuracion_notificaciones
  UPDATE configuracion_notificaciones SET usuario_id = target_usuario_id WHERE usuario_id IS NULL;
  RAISE NOTICE '✅ configuracion_notificaciones actualizados';

  -- Asignar notificaciones (vinculadas a pacientes del usuario)
  UPDATE notificaciones n SET usuario_id = p.usuario_id
  FROM pacientes p
  WHERE n.paciente_id = p.id AND n.usuario_id IS NULL;
  RAISE NOTICE '✅ notificaciones actualizados';
END $$;

-- ============================================================
-- Verificación: mostrar cuántos registros quedaron sin asignar
-- ============================================================
SELECT 'pacientes' AS tabla, COUNT(*) AS sin_usuario FROM pacientes WHERE usuario_id IS NULL
UNION ALL
SELECT 'turnos', COUNT(*) FROM turnos WHERE usuario_id IS NULL
UNION ALL
SELECT 'sesiones', COUNT(*) FROM sesiones WHERE usuario_id IS NULL
UNION ALL
SELECT 'evaluaciones', COUNT(*) FROM evaluaciones WHERE usuario_id IS NULL
UNION ALL
SELECT 'pagos', COUNT(*) FROM pagos WHERE usuario_id IS NULL
UNION ALL
SELECT 'informes', COUNT(*) FROM informes WHERE usuario_id IS NULL
UNION ALL
SELECT 'consultorios', COUNT(*) FROM consultorios WHERE usuario_id IS NULL
UNION ALL
SELECT 'obras_sociales', COUNT(*) FROM obras_sociales WHERE usuario_id IS NULL
UNION ALL
SELECT 'config_notificaciones', COUNT(*) FROM configuracion_notificaciones WHERE usuario_id IS NULL
UNION ALL
SELECT 'notificaciones', COUNT(*) FROM notificaciones WHERE usuario_id IS NULL;

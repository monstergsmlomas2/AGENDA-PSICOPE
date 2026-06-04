-- Migración 012: UNIQUE constraint en configuracion_notificaciones.usuario_id
-- Necesario para que el UPSERT ON CONFLICT (usuario_id) funcione correctamente.

-- Primero eliminar la fila id=1 con usuario_id NULL si existe y no tiene datos útiles
-- (solo si no hay otras filas con usuario_id real que puedan tener conflicto)
DELETE FROM configuracion_notificaciones WHERE usuario_id IS NULL;

-- Agregar el constraint UNIQUE si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'configuracion_notificaciones_usuario_id_key'
  ) THEN
    ALTER TABLE configuracion_notificaciones ADD CONSTRAINT configuracion_notificaciones_usuario_id_key UNIQUE (usuario_id);
  END IF;
END $$;

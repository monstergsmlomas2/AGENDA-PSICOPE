-- ============================================================
-- Migración 004: Correcciones post-auditoría
-- ============================================================
-- Fecha: 2026-05-26
-- Ejecutar en: Supabase SQL Editor
-- Seguro para re-ejecutar (idempotente)
-- ============================================================


-- BLOQUE 1: fecha_vencimiento en informes y evaluaciones

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'informes' AND column_name = 'fecha_vencimiento') THEN
    ALTER TABLE informes ADD COLUMN fecha_vencimiento DATE;
    RAISE NOTICE 'fecha_vencimiento agregada a informes';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'evaluaciones' AND column_name = 'fecha_vencimiento') THEN
    ALTER TABLE evaluaciones ADD COLUMN fecha_vencimiento DATE;
    RAISE NOTICE 'fecha_vencimiento agregada a evaluaciones';
  END IF;
END $$;


-- BLOQUE 2: created_at en tablas que la usan como fecha_creacion

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pacientes' AND column_name = 'created_at') THEN
    ALTER TABLE pacientes ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    UPDATE pacientes SET created_at = fecha_creacion WHERE fecha_creacion IS NOT NULL;
    RAISE NOTICE 'created_at agregada a pacientes';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'turnos' AND column_name = 'created_at') THEN
    ALTER TABLE turnos ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    UPDATE turnos SET created_at = fecha_creacion WHERE fecha_creacion IS NOT NULL;
    RAISE NOTICE 'created_at agregada a turnos';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sesiones' AND column_name = 'created_at') THEN
    ALTER TABLE sesiones ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'created_at agregada a sesiones';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consultorios' AND column_name = 'created_at') THEN
    ALTER TABLE consultorios ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'created_at agregada a consultorios';
  END IF;
END $$;


-- BLOQUE 3: Foreign keys

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_sesiones_paciente') THEN
    ALTER TABLE sesiones ADD CONSTRAINT fk_sesiones_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE RESTRICT;
    RAISE NOTICE 'FK fk_sesiones_paciente creada';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_turnos_paciente') THEN
    ALTER TABLE turnos ADD CONSTRAINT fk_turnos_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE RESTRICT;
    RAISE NOTICE 'FK fk_turnos_paciente creada';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_informes_paciente') THEN
    ALTER TABLE informes ADD CONSTRAINT fk_informes_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE RESTRICT;
    RAISE NOTICE 'FK fk_informes_paciente creada';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_evaluaciones_paciente') THEN
    ALTER TABLE evaluaciones ADD CONSTRAINT fk_evaluaciones_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE RESTRICT;
    RAISE NOTICE 'FK fk_evaluaciones_paciente creada';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_pagos_paciente') THEN
    ALTER TABLE pagos ADD CONSTRAINT fk_pagos_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE RESTRICT;
    RAISE NOTICE 'FK fk_pagos_paciente creada';
  END IF;
END $$;


-- BLOQUE 4: Índice en pacientes(dni)

CREATE INDEX IF NOT EXISTS idx_pacientes_dni ON pacientes(dni);


-- BLOQUE 5: Corregir tipos en evaluaciones

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'evaluaciones' AND column_name = 'resultados' AND data_type = 'text') THEN
    ALTER TABLE evaluaciones ALTER COLUMN resultados TYPE JSONB
      USING CASE WHEN resultados IS NULL OR resultados = '' THEN NULL ELSE to_jsonb(resultados) END;
    RAISE NOTICE 'evaluaciones.resultados convertido a JSONB';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'evaluaciones' AND column_name = 'puntaje_obtenido' AND data_type IN ('character varying', 'varchar', 'text')) THEN
    ALTER TABLE evaluaciones ALTER COLUMN puntaje_obtenido TYPE NUMERIC
      USING CASE
        WHEN puntaje_obtenido IS NULL OR puntaje_obtenido = '' THEN NULL
        WHEN puntaje_obtenido ~ '^[0-9]+(\.[0-9]+)?$' THEN puntaje_obtenido::NUMERIC
        ELSE NULL
      END;
    RAISE NOTICE 'evaluaciones.puntaje_obtenido convertido a NUMERIC';
  END IF;
END $$;


-- ============================================================
-- Verificación post-ejecución:
-- SELECT table_name, column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name IN ('informes','evaluaciones','pacientes','sesiones','turnos','consultorios')
--   AND column_name IN ('created_at','fecha_vencimiento','resultados','puntaje_obtenido')
-- ORDER BY table_name, column_name;
-- ============================================================

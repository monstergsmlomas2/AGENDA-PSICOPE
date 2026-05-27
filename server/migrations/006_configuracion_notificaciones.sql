CREATE TABLE IF NOT EXISTS configuracion_notificaciones (
  id SERIAL PRIMARY KEY,
  notificaciones_pacientes BOOLEAN DEFAULT true,
  notificaciones_profesional BOOLEAN DEFAULT true,
  telefono_profesional VARCHAR(50),
  hora_envio VARCHAR(5) DEFAULT '17:00',
  mensaje_paciente TEXT DEFAULT 'Hola {nombre}! Te recordamos que tenés turno mañana {fecha} a las {hora} en {consultorio}. Ante cualquier cambio comunicate con nosotros. ¡Hasta mañana!',
  mensaje_profesional TEXT DEFAULT 'Recordatorio: mañana {fecha} tenés {cantidad} turno(s):\n{lista_turnos}',
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar fila única de configuración si no existe
INSERT INTO configuracion_notificaciones (id) VALUES (1) ON CONFLICT DO NOTHING;

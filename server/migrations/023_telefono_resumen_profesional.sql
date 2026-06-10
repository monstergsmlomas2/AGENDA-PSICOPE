-- Número de teléfono SEPARADO al que se envía el resumen diario del profesional.
-- Motivo: si el resumen se manda al mismo número conectado a WhatsApp (telefono_profesional),
-- WhatsApp lo trata como "Mensajes contigo mismo" y NUNCA emite notificación sonora.
-- Configurando aquí un número distinto (otro celular, secretaria, etc.) el resumen sí suena.
-- Si queda NULL/vacío, el job usa telefono_profesional como antes (comportamiento previo).
ALTER TABLE configuracion_notificaciones
  ADD COLUMN IF NOT EXISTS telefono_resumen VARCHAR(50);

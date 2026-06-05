-- Migración 019: tabla para suscripciones de notificaciones push (Web Push API)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          BIGSERIAL PRIMARY KEY,
  usuario_id  UUID NOT NULL,
  endpoint    TEXT NOT NULL,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (usuario_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_usuario ON push_subscriptions (usuario_id);

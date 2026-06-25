-- GateWay:Colossus — Phase 12 Migration: API & Integrations
-- Run this in Supabase SQL editor

-- ── API Keys ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.api_keys (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  key_prefix text NOT NULL, -- First 8 chars for identification
  scopes text[] DEFAULT ARRAY['read:projects'],
  rate_limit integer DEFAULT 100, -- requests per hour
  last_used_at timestamptz,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);

-- ── Webhooks ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.webhooks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url text NOT NULL,
  secret text NOT NULL, -- For HMAC signature verification
  events text[] DEFAULT ARRAY['project.created', 'project.liked', 'project.commented'],
  is_active boolean DEFAULT true,
  last_triggered_at timestamptz,
  last_status integer, -- HTTP status code of last delivery
  failure_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON public.webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_is_active ON public.webhooks(is_active);

-- ── Webhook Deliveries ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id uuid NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  event text NOT NULL,
  payload jsonb NOT NULL,
  status_code integer,
  response_body text,
  duration_ms integer,
  success boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON public.webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created ON public.webhook_deliveries(created_at DESC);

── RLS Policies ───────────────────────────────────────────────────────
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- API keys: users can manage their own keys
CREATE POLICY "Users can view their own API keys" ON public.api_keys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create API keys" ON public.api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own API keys" ON public.api_keys FOR DELETE USING (auth.uid() = user_id);

-- Webhooks: users can manage their own webhooks
CREATE POLICY "Users can view their own webhooks" ON public.webhooks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create webhooks" ON public.webhooks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own webhooks" ON public.webhooks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own webhooks" ON public.webhooks FOR DELETE USING (auth.uid() = user_id);

-- Webhook deliveries: users can view their own deliveries
CREATE POLICY "Users can view their own webhook deliveries" ON public.webhook_deliveries FOR SELECT USING (
  EXISTS (SELECT 1 FROM webhooks WHERE webhooks.id = webhook_deliveries.webhook_id AND webhooks.user_id = auth.uid())
);

-- ── Functions ──────────────────────────────────────────────────────────
-- Log webhook delivery
CREATE OR REPLACE FUNCTION public.log_webhook_delivery(
  p_webhook_id uuid,
  p_event text,
  p_payload jsonb,
  p_status_code integer,
  p_response_body text,
  p_duration_ms integer,
  p_success boolean
)
RETURNS uuid AS $$
  DECLARE
    v_id uuid;
  BEGIN
    INSERT INTO webhook_deliveries (webhook_id, event, payload, status_code, response_body, duration_ms, success)
    VALUES (p_webhook_id, p_event, p_payload, p_status_code, p_response_body, p_duration_ms, p_success)
    RETURNING id INTO v_id;

    -- Update webhook last_triggered
    UPDATE webhooks
    SET last_triggered_at = now(),
        last_status = p_status_code,
        failure_count = CASE WHEN p_success THEN 0 ELSE failure_count + 1 END
    WHERE id = p_webhook_id;

    RETURN v_id;
  END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Trigger: Auto-fire webhooks on project events ─────────────────────
CREATE OR REPLACE FUNCTION public.trigger_webhook_on_project()
RETURNS trigger AS $$
DECLARE
  v_webhook record;
  v_payload jsonb;
BEGIN
  -- Build payload
  v_payload = jsonb_build_object(
    'event', TG_OP = 'INSERT' AND TG_TABLE_NAME = 'likes' THEN 'project.liked'
              WHEN TG_OP = 'INSERT' AND TG_TABLE_NAME = 'comments' THEN 'project.commented'
              ELSE 'project.updated',
    'timestamp', now(),
    'project_id', COALESCE(NEW.project_id, OLD.project_id),
    'user_id', NEW.user_id
  );

  -- Find matching active webhooks
  FOR v_webhook IN
    SELECT * FROM webhooks
    WHERE is_active = true
    AND (v_payload->>'event' = ANY(events) OR events @> ARRAY['*'])
  LOOP
    -- Insert delivery record (actual HTTP delivery happens in application layer)
    INSERT INTO webhook_deliveries (webhook_id, event, payload, success)
    VALUES (v_webhook.id, v_payload->>'event', v_payload, true);
  END LOOP;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach triggers
DROP TRIGGER IF EXISTS trg_webhook_on_like ON public.likes;
CREATE TRIGGER trg_webhook_on_like
  AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.trigger_webhook_on_project();

DROP TRIGGER IF EXISTS trg_webhook_on_comment ON public.comments;
CREATE TRIGGER trg_webhook_on_comment
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.trigger_webhook_on_project();

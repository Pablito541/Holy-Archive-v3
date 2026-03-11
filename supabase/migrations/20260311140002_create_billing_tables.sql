-- Plans table: defines available subscription tiers
CREATE TABLE plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,                     -- 'free', 'starter', 'professional', 'enterprise'
  max_items INT NOT NULL,                 -- max active items (use -1 for unlimited)
  max_members INT NOT NULL,               -- max team members
  max_storage_mb INT NOT NULL,            -- max storage in MB
  price_eur_monthly DECIMAL(10,2) NOT NULL,
  features JSONB NOT NULL DEFAULT '{}',   -- feature flags
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions table: links an organization to a plan
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id),
  status TEXT NOT NULL DEFAULT 'active',  -- 'active', 'past_due', 'canceled', 'trialing'
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default plans
INSERT INTO plans (name, max_items, max_members, max_storage_mb, price_eur_monthly, features)
VALUES
  ('free', 50, 2, 500, 0.00, '{"export": true, "audit_log": false, "priority_support": false}'::jsonb),
  ('starter', 500, 5, 5120, 29.00, '{"export": true, "audit_log": true, "priority_support": false}'::jsonb),
  ('professional', -1, 20, 51200, 79.00, '{"export": true, "audit_log": true, "priority_support": true}'::jsonb);

-- RLS for plans: readable by all authenticated users
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read plans"
  ON plans FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- RLS for subscriptions: only org members can read their subscription
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read subscriptions"
  ON subscriptions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Index for fast plan lookup
CREATE INDEX idx_subscriptions_org ON subscriptions (organization_id);

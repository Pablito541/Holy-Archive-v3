-- Plans table for SaaS subscription tiers
CREATE TABLE IF NOT EXISTS plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  price_eur NUMERIC(10,2) NOT NULL DEFAULT 0,
  interval TEXT NOT NULL DEFAULT 'month', -- month, year
  max_items INTEGER,          -- NULL = unlimited
  max_users INTEGER NOT NULL DEFAULT 1,
  max_storage_mb INTEGER NOT NULL DEFAULT 100,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed the three plans
INSERT INTO plans (name, display_name, price_eur, max_items, max_users, max_storage_mb, features) VALUES
  ('free', 'Free', 0, 50, 1, 100, '["Inventar-Verwaltung", "Basis-Dashboard", "Export"]'::jsonb),
  ('starter', 'Starter', 19, 500, 3, 1024, '["Inventar-Verwaltung", "Erweitertes Dashboard", "Export", "Zertifikate", "Ausgaben-Tracking"]'::jsonb),
  ('professional', 'Professional', 49, NULL, 10, 10240, '["Inventar-Verwaltung", "Erweitertes Dashboard", "Export", "Zertifikate", "Ausgaben-Tracking", "Priority Support", "API-Zugang"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- RLS: Everyone can read plans (needed for signup/onboarding)
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plans are publicly readable"
ON plans FOR SELECT
TO public
USING (is_active = true);

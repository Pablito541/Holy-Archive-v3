-- Problem 1.2: Unvollständige Row-Level Security

-- 1. Enable RLS on tables where it might be missing
ALTER TABLE certificate_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_certificates ENABLE ROW LEVEL SECURITY;

-- 2. Create Organization Members Access policies for lookup tables
DROP POLICY IF EXISTS "Organization Members Access" ON certificate_providers;
CREATE POLICY "Organization Members Access" ON certificate_providers FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM organization_members WHERE organization_id = certificate_providers.organization_id)
);

DROP POLICY IF EXISTS "Organization Members Access" ON expense_categories;
CREATE POLICY "Organization Members Access" ON expense_categories FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM organization_members WHERE organization_id = expense_categories.organization_id)
);

DROP POLICY IF EXISTS "Organization Members Access" ON item_certificates;
CREATE POLICY "Organization Members Access" ON item_certificates FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM organization_members WHERE organization_id = item_certificates.organization_id)
);

-- 3. Showroom Context for Public "in_stock" Items
-- Add a showroom_enabled flag to organizations if it doesn't exist
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS showroom_enabled BOOLEAN DEFAULT false;

-- Enable showroom for the main organization by default to not break existing app state
UPDATE organizations SET showroom_enabled = true WHERE slug = 'holy-archive';

-- Drop the old overly permissive public policy (from create_public_policy.sql)
DROP POLICY IF EXISTS "Allow public to view in_stock items" ON items;

-- Create the restricted public policy requiring showroom_enabled = true
CREATE POLICY "Allow public to view in_stock items"
ON items FOR SELECT TO public
USING (
  status = 'in_stock' AND 
  (SELECT showroom_enabled FROM organizations WHERE id = items.organization_id) = true
);

-- Note: In a true SaaS, organizations might want to expose other statuses (e.g., 'sold', 'reserved') in their showroom,
-- but the requirement specifically mentioned restricting the existing policy for `in_stock`.

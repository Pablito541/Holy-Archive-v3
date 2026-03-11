-- Migration: Add missing foreign key constraints and unique constraints

-- Drop existing constraints if any
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_organization_id_fkey;
ALTER TABLE certificate_providers DROP CONSTRAINT IF EXISTS certificate_providers_organization_id_fkey;
ALTER TABLE item_certificates DROP CONSTRAINT IF EXISTS item_certificates_organization_id_fkey;

-- Add ON DELETE CASCADE foreign key constraints
ALTER TABLE expenses
  ADD CONSTRAINT expenses_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE certificate_providers
  ADD CONSTRAINT certificate_providers_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE item_certificates
  ADD CONSTRAINT item_certificates_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- Add UNIQUE constraints
ALTER TABLE certificate_providers
  ADD CONSTRAINT certificate_providers_org_name_key UNIQUE(organization_id, name);

ALTER TABLE expense_categories
  ADD CONSTRAINT expense_categories_org_name_key UNIQUE(organization_id, name);

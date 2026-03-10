-- Migration: Add missing database indices for scalability

-- items indexes
CREATE INDEX IF NOT EXISTS idx_items_org_status ON items(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_items_org_created_at ON items(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_items_org_sale_date ON items(organization_id, sale_date);

-- organization_members indexes (vital for RLS)
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON organization_members(organization_id);

-- item_certificates indexes
CREATE INDEX IF NOT EXISTS idx_item_certificates_item_id ON item_certificates(item_id);
CREATE INDEX IF NOT EXISTS idx_item_certificates_org_id ON item_certificates(organization_id);

-- expenses indexes
CREATE INDEX IF NOT EXISTS idx_expenses_org_date ON expenses(organization_id, date);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);

-- categories and providers
CREATE INDEX IF NOT EXISTS idx_expense_categories_org_id ON expense_categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_certificate_providers_org_id ON certificate_providers(organization_id);

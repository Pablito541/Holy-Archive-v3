-- Certificate Sales table: standalone certificate sales (not tied to items)
CREATE TABLE certificate_sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES certificate_providers(id),
  provider_name TEXT,                      -- fallback if provider_id not available
  customer_name TEXT,
  sale_price_eur DECIMAL(10,2) NOT NULL CHECK (sale_price_eur >= 0),
  cost_eur DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (cost_eur >= 0),
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sale_channel TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_certificate_sales_org ON certificate_sales (organization_id, sale_date DESC);

-- RLS
ALTER TABLE certificate_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read certificate_sales"
  ON certificate_sales FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can insert certificate_sales"
  ON certificate_sales FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can update certificate_sales"
  ON certificate_sales FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can delete certificate_sales"
  ON certificate_sales FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Attach audit trigger to certificate_sales
CREATE TRIGGER certificate_sales_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON certificate_sales
  FOR EACH ROW EXECUTE FUNCTION log_changes();

-- Migrate existing fake certificate items from items table to certificate_sales
-- These are items where model = 'Zertifikat' and notes = 'Unabhängiges Zertifikat'
INSERT INTO certificate_sales (organization_id, provider_name, customer_name, sale_price_eur, cost_eur, sale_date, sale_channel, notes, created_at)
SELECT
  organization_id,
  brand AS provider_name,
  buyer AS customer_name,
  COALESCE(sale_price_eur, 0),
  COALESCE(purchase_price_eur, 0),
  COALESCE(sale_date::date, CURRENT_DATE),
  sale_channel,
  'Migriert aus Items-Tabelle',
  created_at
FROM items
WHERE model = 'Zertifikat'
  AND notes = 'Unabhängiges Zertifikat'
  AND status = 'sold';

-- Soft-delete the migrated fake items
UPDATE items
SET deleted_at = NOW()
WHERE model = 'Zertifikat'
  AND notes = 'Unabhängiges Zertifikat'
  AND status = 'sold'
  AND deleted_at IS NULL;

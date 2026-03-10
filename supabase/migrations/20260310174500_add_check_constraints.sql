-- Migration: Add CHECK constraints to ensure data integrity

-- Items table constraints
ALTER TABLE items ADD CONSTRAINT check_items_purchase_price_eur_positive CHECK (purchase_price_eur >= 0);
ALTER TABLE items ADD CONSTRAINT check_items_sale_price_eur_positive CHECK (sale_price_eur IS NULL OR sale_price_eur >= 0);
ALTER TABLE items ADD CONSTRAINT check_items_platform_fees_eur_positive CHECK (platform_fees_eur IS NULL OR platform_fees_eur >= 0);
ALTER TABLE items ADD CONSTRAINT check_items_shipping_cost_eur_positive CHECK (shipping_cost_eur IS NULL OR shipping_cost_eur >= 0);
ALTER TABLE items ADD CONSTRAINT check_items_status_valid CHECK (status IN ('in_stock', 'reserved', 'sold'));
ALTER TABLE items ADD CONSTRAINT check_items_condition_valid CHECK (condition IN ('mint', 'very_good', 'good', 'fair', 'poor'));
ALTER TABLE items ADD CONSTRAINT check_items_category_valid CHECK (category IN ('bag', 'wallet', 'accessory', 'lock', 'other'));

-- Expenses table constraints
ALTER TABLE expenses ADD CONSTRAINT check_expenses_amount_eur_positive CHECK (amount_eur >= 0);
ALTER TABLE expenses ADD CONSTRAINT check_expenses_recurring_logic CHECK (
  (is_recurring = false AND recurring_interval IS NULL) OR 
  (is_recurring = true AND recurring_interval IN ('monthly', 'quarterly', 'semi_annually', 'yearly'))
);

-- Item Certificates constraints
ALTER TABLE item_certificates ADD CONSTRAINT check_item_certificates_cost_eur_positive CHECK (cost_eur IS NULL OR cost_eur >= 0);
ALTER TABLE item_certificates ADD CONSTRAINT check_item_certificates_sale_price_eur_positive CHECK (sale_price_eur IS NULL OR sale_price_eur >= 0);

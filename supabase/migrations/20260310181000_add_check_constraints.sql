-- Problem 1.6: Add Check Constraints for prices ensuring they are >= 0

-- Items Domain
ALTER TABLE items ADD CONSTRAINT items_purchase_price_check CHECK (purchase_price_eur >= 0);
ALTER TABLE items ADD CONSTRAINT items_sale_price_check CHECK (sale_price_eur IS NULL OR sale_price_eur >= 0);
ALTER TABLE items ADD CONSTRAINT items_platform_fees_check CHECK (platform_fees_eur IS NULL OR platform_fees_eur >= 0);
ALTER TABLE items ADD CONSTRAINT items_shipping_cost_check CHECK (shipping_cost_eur IS NULL OR shipping_cost_eur >= 0);

-- Expenses Domain
ALTER TABLE expenses ADD CONSTRAINT expenses_amount_check CHECK (amount_eur >= 0);

-- Certificates Domain
ALTER TABLE item_certificates ADD CONSTRAINT item_certificates_cost_check CHECK (cost_eur >= 0);
ALTER TABLE item_certificates ADD CONSTRAINT item_certificates_sale_price_check CHECK (sale_price_eur IS NULL OR sale_price_eur >= 0);
ALTER TABLE certificate_providers ADD CONSTRAINT certificate_providers_unit_cost_check CHECK (unit_cost_eur >= 0);

-- Make sure that any string fields lengths are implicitly checked by app logic,
-- PostgreSQL can use VARCHAR(length) but altering TEXT to VARCHAR can be destructive if existing data exceeds the new length.
-- The check constraint allows testing without data type changes.
ALTER TABLE items ADD CONSTRAINT items_brand_length_check CHECK (char_length(brand) <= 100);
ALTER TABLE items ADD CONSTRAINT items_model_length_check CHECK (model IS NULL OR char_length(model) <= 200);
ALTER TABLE items ADD CONSTRAINT items_notes_length_check CHECK (notes IS NULL OR char_length(notes) <= 2000);

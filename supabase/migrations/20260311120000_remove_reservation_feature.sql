-- Remove reservation feature entirely
-- 1. Reset any reserved items to in_stock
UPDATE items SET status = 'in_stock' WHERE status = 'reserved';

-- 2. Drop dependent views first
DROP VIEW IF EXISTS showroom_items_with_likes CASCADE;
DROP VIEW IF EXISTS showroom_items CASCADE;

-- 3. Drop reservation columns
ALTER TABLE items DROP COLUMN IF EXISTS reserved_for;
ALTER TABLE items DROP COLUMN IF EXISTS reserved_until;

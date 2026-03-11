-- Remove reservation feature: columns and any reserved items

-- First, move any currently reserved items back to in_stock
UPDATE items
SET status = 'in_stock',
    reserved_for = NULL,
    reserved_until = NULL
WHERE status = 'reserved';

-- Drop deprecated showroom views that depend on reserved_for column
-- (Showroom feature was already removed from the app)
DROP VIEW IF EXISTS showroom_items_with_likes CASCADE;
DROP VIEW IF EXISTS showroom_items CASCADE;

-- Drop the reservation columns
ALTER TABLE items DROP COLUMN IF EXISTS reserved_for;
ALTER TABLE items DROP COLUMN IF EXISTS reserved_until;

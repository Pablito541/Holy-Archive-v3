-- Remove showroom/shop feature artifacts

-- Drop showroom views
DROP VIEW IF EXISTS public_items_by_showroom;
DROP VIEW IF EXISTS showroom_items;
DROP VIEW IF EXISTS official_user_ids;

-- Drop the public items policy that was only for showroom
DROP POLICY IF EXISTS "Public can view in_stock items" ON items;

-- Drop the leads table (was only used for showroom)
DROP TABLE IF EXISTS leads;

-- 1. Performance: Add Missing Indexes
-- organization_members table foreign keys
create index if not exists idx_organization_members_user_id on public.organization_members(user_id);

-- 2. Security: Secure the set_item_organization function
-- The advisor warned about mutable search_path. We set it to public.
create or replace function set_item_organization() returns trigger
security definer
set search_path = public
as $$
begin
  if new.organization_id is null then
    select organization_id into new.organization_id
    from organization_members
    where user_id = new.user_id
    limit 1;
  end if;
  return new;
end;
$$ language plpgsql;

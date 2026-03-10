-- Add constraint to organization_members role
alter table organization_members
add constraint check_role check (role in ('owner', 'admin', 'member', 'viewer'));

-- We should update RLS policies, but we need to see what exists first

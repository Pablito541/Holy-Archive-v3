-- function to create an organization and a user membership
create or replace function create_organization_for_user(
  p_org_name text,
  p_user_id uuid
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_org_id uuid;
  v_slug text;
begin
  -- Generate a basic slug (in a real app, maybe handle duplicates, but for now just lowercase and replace spaces)
  v_slug := lower(regexp_replace(p_org_name, '\s+', '-', 'g')) || '-' || substr(md5(random()::text), 1, 6);

  -- Insert Organization
  insert into organizations (name, slug)
  values (p_org_name, v_slug)
  returning id into v_org_id;

  -- Insert Owner Membership
  insert into organization_members (organization_id, user_id, role)
  values (v_org_id, p_user_id, 'owner');

  -- Add default expense categories for the new organization
  insert into expense_categories (organization_id, name)
  values
    (v_org_id, 'Verpackungsmaterial'),
    (v_org_id, 'Software/Abo'),
    (v_org_id, 'Reinigung/Aufbereitung'),
    (v_org_id, 'Sonstiges');

  return v_org_id;
end;
$$;

-- 1. Helper Function for checking roles in RLS
create or replace function public.get_user_role(p_org_id uuid)
returns text
language sql security definer
as $$
  select role from public.organization_members
  where organization_id = p_org_id and user_id = auth.uid()
  limit 1;
$$;

-- 2. Drop all possibly existing permissive policies on the relevant tables
do $$
declare
  t text;
begin
  for t in select unnest(array['items', 'leads', 'expenses', 'item_certificates', 'certificate_providers', 'expense_categories']) loop
    execute 'drop policy if exists "Organization Members Access" on ' || t;
    execute 'drop policy if exists "Users can only access their own items" on ' || t;
    execute 'drop policy if exists "Users insert their own items" on ' || t;
    execute 'drop policy if exists "Users update their own items" on ' || t;
    execute 'drop policy if exists "Users delete their own items" on ' || t;
  end loop;
end $$;

-- 3. RLS for ITEMS
drop policy if exists "Allow public to view in_stock items" on items;

create policy "Items: Select for members and defined public items" on items for select using (
  (get_user_role(organization_id) is not null)
  or
  (status = 'in_stock' and (select showroom_enabled from organizations where id = items.organization_id) = true)
);

create policy "Items: Insert for members (except viewers)" on items for insert with check (
  get_user_role(organization_id) in ('owner', 'admin', 'member')
);

create policy "Items: Update for members (except viewers)" on items for update using (
  get_user_role(organization_id) in ('owner', 'admin', 'member')
);

create policy "Items: Delete for owner and admin" on items for delete using (
  get_user_role(organization_id) in ('owner', 'admin')
);

-- 4. RLS for LEADS
create policy "Leads: Select for members" on leads for select using (
  get_user_role(organization_id) is not null
);

create policy "Leads: Insert for members" on leads for insert with check (
  get_user_role(organization_id) in ('owner', 'admin', 'member')
);

create policy "Leads: Update for members" on leads for update using (
  get_user_role(organization_id) in ('owner', 'admin', 'member')
);

create policy "Leads: Delete for owner and admin" on leads for delete using (
  get_user_role(organization_id) in ('owner', 'admin')
);

-- 5. RLS for EXPENSES
create policy "Expenses: Select for members" on expenses for select using (
  get_user_role(organization_id) is not null
);

create policy "Expenses: Insert for members" on expenses for insert with check (
  get_user_role(organization_id) in ('owner', 'admin', 'member')
);

create policy "Expenses: Update for members" on expenses for update using (
  get_user_role(organization_id) in ('owner', 'admin', 'member')
);

create policy "Expenses: Delete for owner and admin" on expenses for delete using (
  get_user_role(organization_id) in ('owner', 'admin')
);

-- 6. RLS for ITEM CERTIFICATES
create policy "ItemCertificates: Select for members" on item_certificates for select using (
  get_user_role(organization_id) is not null
);

create policy "ItemCertificates: Insert for members" on item_certificates for insert with check (
  get_user_role(organization_id) in ('owner', 'admin', 'member')
);

create policy "ItemCertificates: Update for members" on item_certificates for update using (
  get_user_role(organization_id) in ('owner', 'admin', 'member')
);

create policy "ItemCertificates: Delete for owner and admin" on item_certificates for delete using (
  get_user_role(organization_id) in ('owner', 'admin')
);

-- 7. RLS for CERTIFICATE PROVIDERS (Settings)
create policy "CertProviders: Select for members" on certificate_providers for select using (
  get_user_role(organization_id) is not null
);

create policy "CertProviders: Insert for owner and admin" on certificate_providers for insert with check (
  get_user_role(organization_id) in ('owner', 'admin')
);

create policy "CertProviders: Update for owner and admin" on certificate_providers for update using (
  get_user_role(organization_id) in ('owner', 'admin')
);

create policy "CertProviders: Delete for owner and admin" on certificate_providers for delete using (
  get_user_role(organization_id) in ('owner', 'admin')
);

-- 8. RLS for EXPENSE CATEGORIES (Settings)
create policy "ExpenseCategories: Select for members" on expense_categories for select using (
  get_user_role(organization_id) is not null
);

create policy "ExpenseCategories: Insert for owner and admin" on expense_categories for insert with check (
  get_user_role(organization_id) in ('owner', 'admin')
);

create policy "ExpenseCategories: Update for owner and admin" on expense_categories for update using (
  get_user_role(organization_id) in ('owner', 'admin')
);

create policy "ExpenseCategories: Delete for owner and admin" on expense_categories for delete using (
  get_user_role(organization_id) in ('owner', 'admin')
);

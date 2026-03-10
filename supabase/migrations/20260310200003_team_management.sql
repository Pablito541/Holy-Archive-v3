create table if not exists invitations (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references organizations(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'member', 'viewer')),
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  status text default 'pending' check (status in ('pending', 'accepted', 'expired')),
  expires_at timestamptz default now() + interval '7 days'
);

-- RLS
alter table invitations enable row level security;

create policy "Admins/Owners manage invitations" on invitations
for all using (
  get_user_role(organization_id) in ('owner', 'admin')
);

create or replace function get_team_members(p_org_id uuid)
returns table (
  member_id uuid,
  user_id uuid,
  role text,
  email varchar,
  created_at timestamptz
) language plpgsql security definer as $$
declare
  v_caller_role text;
begin
  -- verify caller
  select org.role into v_caller_role from organization_members org where org.organization_id = p_org_id and org.user_id = auth.uid();
  if v_caller_role is null then
    raise exception 'Unauthorized';
  end if;

  return query
  select 
    om.id as member_id,
    om.user_id,
    om.role,
    u.email::varchar,
    om.created_at
  from organization_members om
  left join auth.users u on u.id = om.user_id
  where om.organization_id = p_org_id;
end;
$$;

create or replace function remove_team_member(p_org_id uuid, p_member_id uuid)
returns void language plpgsql security definer as $$
declare
  v_caller_role text;
  v_target_user_id uuid;
begin
  select role into v_caller_role from organization_members where organization_id = p_org_id and user_id = auth.uid();
  if v_caller_role not in ('owner', 'admin') then
    raise exception 'Unauthorized';
  end if;
  
  select user_id into v_target_user_id from organization_members where id = p_member_id;
  if v_target_user_id = auth.uid() then
    raise exception 'Cannot remove yourself';
  end if;
  
  delete from organization_members where id = p_member_id and organization_id = p_org_id;
end;
$$;

create or replace function update_team_member_role(p_org_id uuid, p_member_id uuid, p_new_role text)
returns void language plpgsql security definer as $$
declare
  v_caller_role text;
  v_target_role text;
  v_target_user_id uuid;
begin
  select role into v_caller_role from organization_members where organization_id = p_org_id and user_id = auth.uid();
  if v_caller_role not in ('owner', 'admin') then
    raise exception 'Unauthorized';
  end if;
  
  select role, user_id into v_target_role, v_target_user_id from organization_members where id = p_member_id;
  
  if v_target_user_id = auth.uid() then
    raise exception 'Cannot change your own role';
  end if;

  if v_target_role = 'owner' and v_caller_role = 'admin' then
    raise exception 'Admins cannot change owner roles';
  end if;

  update organization_members set role = p_new_role where id = p_member_id and organization_id = p_org_id;
end;
$$;

-- TRIGGER FOR AUTH.USERS
create or replace function handle_user_invite_acceptance()
returns trigger language plpgsql security definer as $$
declare
  v_inv record;
begin
  -- Find pending invitation for this email
  for v_inv in select * from invitations where email = new.email and status = 'pending' loop
    -- Insert into organization_members
    insert into organization_members (organization_id, user_id, role)
    values (v_inv.organization_id, new.id, v_inv.role)
    on conflict (organization_id, user_id) do nothing;
    
    -- Mark invitation as accepted
    update invitations set status = 'accepted' where id = v_inv.id;
  end loop;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_accept_invite on auth.users;
create trigger on_auth_user_created_accept_invite
  after insert on auth.users
  for each row execute procedure handle_user_invite_acceptance();

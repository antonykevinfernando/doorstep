-- =============================================
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- Combines migrations 00002 + 00003
-- =============================================

-- ===== Migration 00002: Resident approval =====

-- Add new columns to profiles
alter table public.profiles
  add column if not exists approved boolean not null default false,
  add column if not exists requested_building_id uuid references public.buildings on delete set null,
  add column if not exists requested_unit_number text,
  add column if not exists requested_move_in_date date;

-- Auto-approve existing managers
update public.profiles set approved = true where role = 'manager';

-- Allow anyone to search buildings (for signup)
do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'Anyone can search buildings' and tablename = 'buildings'
  ) then
    create policy "Anyone can search buildings" on public.buildings for select using (true);
  end if;
end $$;

-- Managers can read pending residents
do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'Managers can read pending residents' and tablename = 'profiles'
  ) then
    create policy "Managers can read pending residents"
      on public.profiles for select using (
        public.user_role() = 'manager'
        and role = 'resident'
        and requested_building_id in (
          select id from public.buildings where org_id = public.user_org_id()
        )
      );
  end if;
end $$;

-- Managers can approve residents
do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'Managers can approve residents' and tablename = 'profiles'
  ) then
    create policy "Managers can approve residents"
      on public.profiles for update using (
        public.user_role() = 'manager'
        and role = 'resident'
        and requested_building_id in (
          select id from public.buildings where org_id = public.user_org_id()
        )
      );
  end if;
end $$;

-- Index for pending approvals
create index if not exists idx_profiles_pending
  on public.profiles (approved, requested_building_id)
  where approved = false and role = 'resident';


-- ===== Migration 00003: Manager onboarding trigger =====

-- Rewrite the signup trigger: managers get org+building created, residents get approval flow
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  _role text;
  _org_id uuid;
begin
  _role := coalesce(new.raw_user_meta_data ->> 'role', 'resident');

  if _role = 'manager' then
    insert into public.organizations (name, slug)
    values (
      coalesce(new.raw_user_meta_data ->> 'org_name', 'My Organization'),
      lower(replace(
        coalesce(new.raw_user_meta_data ->> 'org_name', 'org'),
        ' ', '-'
      )) || '-' || substr(gen_random_uuid()::text, 1, 8)
    )
    returning id into _org_id;

    if new.raw_user_meta_data ->> 'building_name' is not null
       or new.raw_user_meta_data ->> 'building_address' is not null then
      insert into public.buildings (org_id, name, address)
      values (
        _org_id,
        coalesce(new.raw_user_meta_data ->> 'building_name', 'Building 1'),
        coalesce(new.raw_user_meta_data ->> 'building_address', '')
      );
    end if;

    insert into public.profiles (id, full_name, role, approved, org_id)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'full_name', ''),
      'manager',
      true,
      _org_id
    );
  else
    insert into public.profiles (
      id, full_name, role, approved,
      requested_building_id, requested_unit_number, requested_move_in_date
    )
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'full_name', ''),
      'resident',
      false,
      case when new.raw_user_meta_data ->> 'building_id' is not null
        then (new.raw_user_meta_data ->> 'building_id')::uuid else null end,
      new.raw_user_meta_data ->> 'unit_number',
      case when new.raw_user_meta_data ->> 'move_in_date' is not null
        then (new.raw_user_meta_data ->> 'move_in_date')::date else null end
    );
  end if;

  return new;
end;
$$;

-- Allow managers to create organizations
drop policy if exists "Managers can create organizations" on public.organizations;
create policy "Managers can create organizations"
  on public.organizations for insert with check (
    public.user_role() = 'manager'
  );

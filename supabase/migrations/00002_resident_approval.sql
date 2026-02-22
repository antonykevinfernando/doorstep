-- Doorstep: Resident approval workflow
-- Migration 00002: Add approval status + move request fields to profiles

-- New columns on profiles
alter table public.profiles
  add column approved boolean not null default false,
  add column requested_building_id uuid references public.buildings on delete set null,
  add column requested_unit_number text,
  add column requested_move_in_date date;

-- Auto-approve existing managers
update public.profiles set approved = true where role = 'manager';

-- Replace the signup trigger to handle new fields
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (
    id, full_name, role, approved,
    requested_building_id, requested_unit_number, requested_move_in_date
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'resident'),
    coalesce(new.raw_user_meta_data ->> 'role', 'resident') = 'manager',
    case when new.raw_user_meta_data ->> 'building_id' is not null
      then (new.raw_user_meta_data ->> 'building_id')::uuid else null end,
    new.raw_user_meta_data ->> 'unit_number',
    case when new.raw_user_meta_data ->> 'move_in_date' is not null
      then (new.raw_user_meta_data ->> 'move_in_date')::date else null end
  );
  return new;
end;
$$;

-- Allow anyone (including anon) to search buildings for signup
create policy "Anyone can search buildings"
  on public.buildings for select using (true);

-- Managers can read pending residents who requested a building in their org
create policy "Managers can read pending residents"
  on public.profiles for select using (
    public.user_role() = 'manager'
    and role = 'resident'
    and requested_building_id in (
      select id from public.buildings where org_id = public.user_org_id()
    )
  );

-- Managers can update residents requesting their buildings (for approval)
create policy "Managers can approve residents"
  on public.profiles for update using (
    public.user_role() = 'manager'
    and role = 'resident'
    and requested_building_id in (
      select id from public.buildings where org_id = public.user_org_id()
    )
  );

-- Index for querying pending approvals
create index idx_profiles_pending on public.profiles (approved, requested_building_id)
  where approved = false and role = 'resident';

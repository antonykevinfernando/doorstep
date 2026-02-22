-- Run this in Supabase SQL Editor to fix the signup trigger.
-- Safe to run multiple times.

-- Step 1: Ensure columns exist (one at a time to avoid chaining issues)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='approved') then
    alter table public.profiles add column approved boolean not null default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='requested_building_id') then
    alter table public.profiles add column requested_building_id uuid references public.buildings on delete set null;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='requested_unit_number') then
    alter table public.profiles add column requested_unit_number text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='requested_move_in_date') then
    alter table public.profiles add column requested_move_in_date date;
  end if;
end $$;

-- Step 2: Auto-approve existing managers
update public.profiles set approved = true where role = 'manager' and approved = false;

-- Step 3: Replace the signup trigger
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
      lower(replace(coalesce(new.raw_user_meta_data ->> 'org_name', 'org'), ' ', '-'))
        || '-' || substr(gen_random_uuid()::text, 1, 8)
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
    insert into public.profiles (id, full_name, role, approved, requested_building_id, requested_unit_number, requested_move_in_date)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'full_name', ''),
      'resident',
      false,
      nullif(new.raw_user_meta_data ->> 'building_id', '')::uuid,
      new.raw_user_meta_data ->> 'unit_number',
      nullif(new.raw_user_meta_data ->> 'move_in_date', '')::date
    );
  end if;

  return new;
exception when others then
  raise log 'handle_new_user failed: % %', sqlerrm, sqlstate;
  raise;
end;
$$;

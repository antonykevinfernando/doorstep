-- Doorstep: Manager onboarding via signup trigger
-- Migration 00003: Extend handle_new_user to create org + building for managers

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
    -- Create org from metadata
    insert into public.organizations (name, slug)
    values (
      coalesce(new.raw_user_meta_data ->> 'org_name', 'My Organization'),
      lower(replace(
        coalesce(new.raw_user_meta_data ->> 'org_name', 'org'),
        ' ', '-'
      )) || '-' || substr(gen_random_uuid()::text, 1, 8)
    )
    returning id into _org_id;

    -- Create the first building if provided
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
    -- Resident signup (unchanged)
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

-- Allow managers to insert into organizations (for adding more orgs later if needed)
create policy "Managers can create organizations"
  on public.organizations for insert with check (
    public.user_role() = 'manager'
  );

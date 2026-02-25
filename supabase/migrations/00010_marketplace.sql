-- Doorstep: Marketplace — vendors, deals, movers, bookings
-- Migration 00010

-- Extend role constraint to include vendor and mover
alter table public.profiles
  drop constraint profiles_role_check,
  add constraint profiles_role_check
    check (role in ('manager', 'resident', 'vendor', 'mover'));

-- ============================================================
-- VENDORS
-- ============================================================

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  business_name text not null,
  logo_url text,
  description text not null default '',
  category text not null default 'general',
  address text not null default '',
  phone text,
  website text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.vendors enable row level security;

create policy "Anyone can read active vendors"
  on public.vendors for select using (is_active = true);

create policy "Vendors manage own record"
  on public.vendors for all using (user_id = auth.uid());

-- ============================================================
-- DEALS
-- ============================================================

create table public.deals (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors on delete cascade,
  title text not null,
  description text not null default '',
  image_url text,
  original_price numeric(10,2),
  deal_price numeric(10,2),
  discount_pct integer,
  category text not null default 'general',
  terms text,
  redemption_code text,
  redemption_link text,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.deals enable row level security;

create policy "Anyone can read active deals"
  on public.deals for select using (
    is_active = true
    and (expires_at is null or expires_at > now())
  );

create policy "Vendors manage own deals"
  on public.deals for all using (
    vendor_id in (select id from public.vendors where user_id = auth.uid())
  );

-- ============================================================
-- MOVERS
-- ============================================================

create table public.movers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  company_name text not null,
  logo_url text,
  description text not null default '',
  phone text,
  service_area text,
  price_range_min numeric(10,2),
  price_range_max numeric(10,2),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.movers enable row level security;

create policy "Anyone can read active movers"
  on public.movers for select using (is_active = true);

create policy "Movers manage own record"
  on public.movers for all using (user_id = auth.uid());

-- ============================================================
-- MOVER BOOKINGS
-- ============================================================

create table public.mover_bookings (
  id uuid primary key default gen_random_uuid(),
  mover_id uuid not null references public.movers on delete cascade,
  resident_id uuid not null references public.profiles on delete cascade,
  move_id uuid references public.moves on delete set null,
  scheduled_date date not null,
  time_slot text,
  status text not null check (status in ('pending', 'confirmed', 'completed', 'cancelled')) default 'pending',
  notes text,
  created_at timestamptz not null default now()
);

alter table public.mover_bookings enable row level security;

create policy "Residents manage own bookings"
  on public.mover_bookings for all using (resident_id = auth.uid());

create policy "Movers view assigned bookings"
  on public.mover_bookings for select using (
    mover_id in (select id from public.movers where user_id = auth.uid())
  );

create policy "Movers update assigned bookings"
  on public.mover_bookings for update using (
    mover_id in (select id from public.movers where user_id = auth.uid())
  );

-- ============================================================
-- UPDATE TRIGGER for new roles
-- ============================================================

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

  elsif _role = 'vendor' then
    insert into public.profiles (id, full_name, role, approved)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'full_name', ''),
      'vendor',
      true
    );

    insert into public.vendors (user_id, business_name, category, address, phone, description)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'business_name', ''),
      coalesce(new.raw_user_meta_data ->> 'category', 'general'),
      coalesce(new.raw_user_meta_data ->> 'address', ''),
      new.raw_user_meta_data ->> 'phone',
      coalesce(new.raw_user_meta_data ->> 'description', '')
    );

  elsif _role = 'mover' then
    insert into public.profiles (id, full_name, role, approved)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'full_name', ''),
      'mover',
      true
    );

    insert into public.movers (user_id, company_name, phone, service_area, description)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'company_name', ''),
      new.raw_user_meta_data ->> 'phone',
      new.raw_user_meta_data ->> 'service_area',
      coalesce(new.raw_user_meta_data ->> 'description', '')
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

-- ============================================================
-- STORAGE bucket for marketplace images
-- ============================================================

insert into storage.buckets (id, name, public) values ('marketplace', 'marketplace', true)
  on conflict do nothing;

create policy "Vendors upload own images"
  on storage.objects for insert with check (
    bucket_id = 'marketplace'
    and (storage.foldername(name))[1] = 'vendors'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "Public read marketplace images"
  on storage.objects for select using (bucket_id = 'marketplace');

create policy "Vendors delete own images"
  on storage.objects for delete using (
    bucket_id = 'marketplace'
    and (storage.foldername(name))[1] = 'vendors'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

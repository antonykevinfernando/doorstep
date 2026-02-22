-- Doorstep: Two-sided move management platform
-- Migration 00001: Initial schema

-- ============================================================
-- TABLES
-- ============================================================

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null check (role in ('manager', 'resident')) default 'resident',
  full_name text not null default '',
  phone text,
  org_id uuid references public.organizations on delete set null,
  created_at timestamptz not null default now()
);

create table public.buildings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations on delete cascade,
  name text not null,
  address text not null default '',
  created_at timestamptz not null default now()
);

create table public.units (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings on delete cascade,
  number text not null,
  floor text,
  created_at timestamptz not null default now()
);

create table public.moves (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('move_in', 'move_out')),
  status text not null check (status in ('pending', 'confirmed', 'in_progress', 'completed')) default 'pending',
  resident_id uuid not null references public.profiles on delete cascade,
  unit_id uuid not null references public.units on delete cascade,
  scheduled_date date not null,
  time_slot text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.checklist_templates (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings on delete cascade,
  title text not null,
  created_at timestamptz not null default now()
);

create table public.checklist_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.checklist_templates on delete cascade,
  title text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.move_tasks (
  id uuid primary key default gen_random_uuid(),
  move_id uuid not null references public.moves on delete cascade,
  title text not null,
  completed boolean not null default false,
  completed_at timestamptz,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  file_path text not null,
  file_size bigint,
  move_id uuid references public.moves on delete cascade,
  building_id uuid references public.buildings on delete cascade,
  uploaded_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  move_id uuid not null references public.moves on delete cascade,
  sender_id uuid not null references public.profiles on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_profiles_org on public.profiles (org_id);
create index idx_buildings_org on public.buildings (org_id);
create index idx_units_building on public.units (building_id);
create index idx_moves_resident on public.moves (resident_id);
create index idx_moves_unit on public.moves (unit_id);
create index idx_move_tasks_move on public.move_tasks (move_id);
create index idx_checklist_items_template on public.checklist_template_items (template_id);
create index idx_documents_move on public.documents (move_id);
create index idx_documents_building on public.documents (building_id);
create index idx_messages_move on public.messages (move_id);

-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.buildings enable row level security;
alter table public.units enable row level security;
alter table public.moves enable row level security;
alter table public.checklist_templates enable row level security;
alter table public.checklist_template_items enable row level security;
alter table public.move_tasks enable row level security;
alter table public.documents enable row level security;
alter table public.messages enable row level security;

-- Helper: get the current user's org_id
create or replace function public.user_org_id()
returns uuid
language sql
stable
security definer
as $$
  select org_id from public.profiles where id = auth.uid()
$$;

-- Helper: get the current user's role
create or replace function public.user_role()
returns text
language sql
stable
security definer
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- PROFILES
create policy "Users can read own profile"
  on public.profiles for select using (id = auth.uid());
create policy "Managers can read profiles in their org"
  on public.profiles for select using (
    public.user_role() = 'manager' and org_id = public.user_org_id()
  );
create policy "Users can update own profile"
  on public.profiles for update using (id = auth.uid());

-- ORGANIZATIONS
create policy "Members can read their org"
  on public.organizations for select using (id = public.user_org_id());
create policy "Managers can update their org"
  on public.organizations for update using (
    id = public.user_org_id() and public.user_role() = 'manager'
  );

-- BUILDINGS
create policy "Members can read buildings in their org"
  on public.buildings for select using (org_id = public.user_org_id());
create policy "Managers can insert buildings"
  on public.buildings for insert with check (
    org_id = public.user_org_id() and public.user_role() = 'manager'
  );
create policy "Managers can update buildings"
  on public.buildings for update using (
    org_id = public.user_org_id() and public.user_role() = 'manager'
  );
create policy "Managers can delete buildings"
  on public.buildings for delete using (
    org_id = public.user_org_id() and public.user_role() = 'manager'
  );

-- UNITS
create policy "Members can read units in their org buildings"
  on public.units for select using (
    building_id in (select id from public.buildings where org_id = public.user_org_id())
  );
create policy "Managers can manage units"
  on public.units for all using (
    public.user_role() = 'manager' and
    building_id in (select id from public.buildings where org_id = public.user_org_id())
  );

-- MOVES
create policy "Managers can read moves in their org"
  on public.moves for select using (
    public.user_role() = 'manager' and
    unit_id in (
      select u.id from public.units u
      join public.buildings b on b.id = u.building_id
      where b.org_id = public.user_org_id()
    )
  );
create policy "Residents can read their own moves"
  on public.moves for select using (resident_id = auth.uid());
create policy "Managers can insert moves"
  on public.moves for insert with check (
    public.user_role() = 'manager'
  );
create policy "Managers can update moves"
  on public.moves for update using (
    public.user_role() = 'manager'
  );

-- CHECKLIST TEMPLATES
create policy "Members can read templates in their org buildings"
  on public.checklist_templates for select using (
    building_id in (select id from public.buildings where org_id = public.user_org_id())
  );
create policy "Managers can manage templates"
  on public.checklist_templates for all using (
    public.user_role() = 'manager' and
    building_id in (select id from public.buildings where org_id = public.user_org_id())
  );

-- CHECKLIST TEMPLATE ITEMS
create policy "Members can read template items"
  on public.checklist_template_items for select using (
    template_id in (
      select ct.id from public.checklist_templates ct
      join public.buildings b on b.id = ct.building_id
      where b.org_id = public.user_org_id()
    )
  );
create policy "Managers can manage template items"
  on public.checklist_template_items for all using (
    public.user_role() = 'manager' and
    template_id in (
      select ct.id from public.checklist_templates ct
      join public.buildings b on b.id = ct.building_id
      where b.org_id = public.user_org_id()
    )
  );

-- MOVE TASKS
create policy "Managers can read move tasks in their org"
  on public.move_tasks for select using (
    public.user_role() = 'manager' and
    move_id in (
      select m.id from public.moves m
      join public.units u on u.id = m.unit_id
      join public.buildings b on b.id = u.building_id
      where b.org_id = public.user_org_id()
    )
  );
create policy "Residents can read their own move tasks"
  on public.move_tasks for select using (
    move_id in (select id from public.moves where resident_id = auth.uid())
  );
create policy "Residents can update their own move tasks"
  on public.move_tasks for update using (
    move_id in (select id from public.moves where resident_id = auth.uid())
  );
create policy "Managers can manage move tasks"
  on public.move_tasks for all using (
    public.user_role() = 'manager'
  );

-- DOCUMENTS
create policy "Managers can manage documents"
  on public.documents for all using (
    public.user_role() = 'manager'
  );
create policy "Residents can read documents for their moves"
  on public.documents for select using (
    move_id in (select id from public.moves where resident_id = auth.uid())
  );
create policy "Residents can read building-level documents"
  on public.documents for select using (
    building_id in (
      select b.id from public.buildings b
      join public.units u on u.building_id = b.id
      join public.moves m on m.unit_id = u.id
      where m.resident_id = auth.uid()
    )
  );

-- MESSAGES
create policy "Participants can read messages"
  on public.messages for select using (
    sender_id = auth.uid() or
    move_id in (select id from public.moves where resident_id = auth.uid()) or
    (public.user_role() = 'manager' and move_id in (
      select m.id from public.moves m
      join public.units u on u.id = m.unit_id
      join public.buildings b on b.id = u.building_id
      where b.org_id = public.user_org_id()
    ))
  );
create policy "Participants can send messages"
  on public.messages for insert with check (
    sender_id = auth.uid() and (
      move_id in (select id from public.moves where resident_id = auth.uid()) or
      public.user_role() = 'manager'
    )
  );

-- ============================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'resident')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- TRIGGER: auto-update updated_at on moves
-- ============================================================

create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger moves_updated_at
  before update on public.moves
  for each row execute function public.update_updated_at();

-- ============================================================
-- STORAGE BUCKET
-- ============================================================

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false);

create policy "Managers can upload documents"
  on storage.objects for insert
  with check (
    bucket_id = 'documents' and public.user_role() = 'manager'
  );

create policy "Authenticated users can read documents"
  on storage.objects for select
  using (bucket_id = 'documents' and auth.role() = 'authenticated');

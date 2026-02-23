-- Elevator scheduling slots and deposit tracking

-- elevator_slots: manager-defined bookable time slots per building
create table if not exists public.elevator_slots (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  move_id uuid references public.moves on delete set null,
  created_at timestamptz not null default now()
);

-- deposits: tracks Stripe authorization holds
create table if not exists public.deposits (
  id uuid primary key default gen_random_uuid(),
  move_id uuid not null references public.moves on delete cascade,
  task_id uuid not null references public.move_tasks on delete cascade,
  stripe_payment_intent_id text not null,
  amount_cents integer not null,
  status text not null check (status in ('authorized', 'captured', 'released', 'expired')) default 'authorized',
  created_at timestamptz not null default now()
);

-- Add config column to checklist_template_items and move_tasks
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name = 'checklist_template_items' and column_name = 'config') then
    alter table public.checklist_template_items add column config jsonb;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'move_tasks' and column_name = 'config') then
    alter table public.move_tasks add column config jsonb;
  end if;
end $$;

-- RLS for elevator_slots
alter table public.elevator_slots enable row level security;

create policy "Managers can manage elevator slots for their org buildings"
  on public.elevator_slots for all
  using (
    building_id in (
      select b.id from public.buildings b
      join public.profiles p on p.org_id = b.org_id
      where p.id = auth.uid() and p.role = 'manager'
    )
  );

create policy "Residents can view slots for their building"
  on public.elevator_slots for select
  using (
    building_id in (
      select b.id from public.buildings b
      join public.units u on u.building_id = b.id
      join public.moves m on m.unit_id = u.id
      where m.resident_id = auth.uid()
    )
  );

create policy "Residents can book available slots"
  on public.elevator_slots for update
  using (
    move_id is null
    and building_id in (
      select b.id from public.buildings b
      join public.units u on u.building_id = b.id
      join public.moves m on m.unit_id = u.id
      where m.resident_id = auth.uid()
    )
  );

-- RLS for deposits
alter table public.deposits enable row level security;

create policy "Managers can view deposits for their org"
  on public.deposits for select
  using (
    move_id in (
      select m.id from public.moves m
      join public.units u on u.id = m.unit_id
      join public.buildings b on b.id = u.building_id
      join public.profiles p on p.org_id = b.org_id
      where p.id = auth.uid() and p.role = 'manager'
    )
  );

create policy "Residents can view their own deposits"
  on public.deposits for select
  using (
    move_id in (
      select m.id from public.moves m where m.resident_id = auth.uid()
    )
  );

-- Enable realtime for new tables
alter publication supabase_realtime add table public.elevator_slots;

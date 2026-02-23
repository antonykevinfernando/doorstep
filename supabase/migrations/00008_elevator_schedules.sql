-- Recurring elevator schedule patterns (replaces per-day slot creation)
-- Managers set these up once; the app generates available slots dynamically

create table if not exists public.elevator_schedules (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now()
);

-- elevator_slots now only stores actual bookings (resident booked a specific date+time)
-- Slots without a move_id from the old approach can be cleaned up

alter table public.elevator_schedules enable row level security;

create policy "Managers can manage elevator schedules"
  on public.elevator_schedules for all
  using (
    building_id in (
      select b.id from public.buildings b
      join public.profiles p on p.org_id = b.org_id
      where p.id = auth.uid() and p.role = 'manager'
    )
  );

create policy "Residents can view schedules for their building"
  on public.elevator_schedules for select
  using (
    building_id in (
      select b.id from public.buildings b
      join public.units u on u.building_id = b.id
      join public.moves m on m.unit_id = u.id
      where m.resident_id = auth.uid()
    )
  );

-- Residents need insert on elevator_slots to create bookings
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'elevator_slots' and policyname = 'Residents can create bookings'
  ) then
    create policy "Residents can create bookings"
      on public.elevator_slots for insert
      with check (
        building_id in (
          select b.id from public.buildings b
          join public.units u on u.building_id = b.id
          join public.moves m on m.unit_id = u.id
          where m.resident_id = auth.uid()
        )
      );
  end if;
end $$;

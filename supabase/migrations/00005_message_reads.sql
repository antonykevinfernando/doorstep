-- Track when users last read each message thread
create table public.message_reads (
  user_id uuid not null references public.profiles on delete cascade,
  move_id uuid not null references public.moves on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (user_id, move_id)
);

alter table public.message_reads enable row level security;

create policy "Users can read own message_reads"
  on public.message_reads for select using (user_id = auth.uid());

create policy "Users can upsert own message_reads"
  on public.message_reads for insert with check (user_id = auth.uid());

create policy "Users can update own message_reads"
  on public.message_reads for update using (user_id = auth.uid());

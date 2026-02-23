-- Add task type, description, and response columns for checklist builder + fulfillment

do $$ begin
  if not exists (select 1 from information_schema.columns where table_name = 'checklist_template_items' and column_name = 'type') then
    alter table public.checklist_template_items add column type text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'checklist_template_items' and column_name = 'description') then
    alter table public.checklist_template_items add column description text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'move_tasks' and column_name = 'type') then
    alter table public.move_tasks add column type text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'move_tasks' and column_name = 'description') then
    alter table public.move_tasks add column description text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'move_tasks' and column_name = 'response') then
    alter table public.move_tasks add column response jsonb;
  end if;
end $$;

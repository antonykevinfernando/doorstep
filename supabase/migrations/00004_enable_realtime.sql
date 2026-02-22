-- Enable Supabase Realtime for tables that need live updates
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.profiles;

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from './sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single();

  // Fetch unread message count across all threads
  const { data: moves } = await supabase
    .from('moves')
    .select('id')
    .or(`resident_id.eq.${user.id},unit_id.in.(select id from units where building_id in (select id from buildings where org_id in (select org_id from profiles where id = '${user.id}')))`);

  let unreadCount = 0;
  if (moves && moves.length > 0) {
    const moveIds = moves.map((m: any) => m.id);

    const { data: reads } = await supabase
      .from('message_reads')
      .select('move_id, last_read_at')
      .eq('user_id', user.id);

    const readMap = new Map((reads ?? []).map((r: any) => [r.move_id, r.last_read_at]));

    for (const moveId of moveIds) {
      const lastRead = readMap.get(moveId);
      let query = supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('move_id', moveId)
        .neq('sender_id', user.id);

      if (lastRead) {
        query = query.gt('created_at', lastRead);
      }

      const { count } = await query;
      unreadCount += count ?? 0;
    }
  }

  return (
    <div className="h-screen flex gap-4 p-4 bg-background">
      <Sidebar
        displayName={profile?.full_name || user.email || ''}
        role={profile?.role || 'manager'}
        userId={user.id}
        initialUnread={unreadCount}
      />
      <main className="flex-1 glass rounded-2xl p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

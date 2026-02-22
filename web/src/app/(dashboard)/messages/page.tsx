import { createClient } from '@/lib/supabase/server';
import { MessageThread } from './message-thread';

export default async function MessagesPage() {
  const supabase = await createClient();

  const { data: moves } = await supabase
    .from('moves')
    .select(`
      id, scheduled_date, type,
      resident:profiles!moves_resident_id_fkey(full_name),
      unit:units!moves_unit_id_fkey(number, building:buildings!units_building_id_fkey(name))
    `)
    .order('scheduled_date', { ascending: false });

  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Communicate with residents about their moves
        </p>
      </div>

      {(!moves || moves.length === 0) ? (
        <div className="text-center py-20 text-muted-foreground">
          No moves to message about yet.
        </div>
      ) : (
        <MessageThread moves={moves} currentUserId={user?.id ?? ''} />
      )}
    </div>
  );
}

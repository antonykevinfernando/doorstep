import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { BookingsView } from './bookings/bookings-view';

export default async function MoverHomePage() {
  const supabase = await createClient();
  const admin = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: mover } = await admin
    .from('movers')
    .select('id')
    .eq('user_id', user!.id)
    .single();

  const { data: bookings } = mover
    ? await admin
        .from('mover_bookings')
        .select(`
          id, scheduled_date, time_slot, status, notes, created_at,
          resident:profiles!mover_bookings_resident_id_fkey(full_name, requested_unit_number)
        `)
        .eq('mover_id', mover.id)
        .order('scheduled_date', { ascending: false })
    : { data: [] };

  return (
    <BookingsView
      moverId={mover?.id ?? ''}
      bookings={(bookings ?? []).map((b: any) => ({
        id: b.id,
        scheduledDate: b.scheduled_date,
        timeSlot: b.time_slot,
        status: b.status,
        notes: b.notes,
        residentName: b.resident?.full_name ?? 'Unknown',
        residentUnit: b.resident?.requested_unit_number ?? null,
        createdAt: b.created_at,
      }))}
    />
  );
}

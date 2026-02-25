import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';

export interface Booking {
  id: string;
  scheduledDate: string;
  timeSlot: string | null;
  status: string;
  notes: string | null;
  moverName: string;
  moverPhone: string | null;
  createdAt: string;
}

export function useBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('mover_bookings')
      .select(`
        id, scheduled_date, time_slot, status, notes, created_at,
        mover:movers!mover_bookings_mover_id_fkey(company_name, phone)
      `)
      .eq('resident_id', user.id)
      .order('scheduled_date', { ascending: false });

    setBookings(
      (data ?? []).map((b: any) => ({
        id: b.id,
        scheduledDate: b.scheduled_date,
        timeSlot: b.time_slot,
        status: b.status,
        notes: b.notes,
        moverName: b.mover?.company_name ?? 'Unknown',
        moverPhone: b.mover?.phone ?? null,
        createdAt: b.created_at,
      })),
    );
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`resident-bookings-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mover_bookings', filter: `resident_id=eq.${user.id}` },
        () => { fetchBookings(); },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchBookings]);

  return { bookings, loading, refetch: fetchBookings };
}

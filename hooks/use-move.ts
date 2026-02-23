import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';

export interface MoveData {
  id: string;
  type: string;
  status: string;
  scheduled_date: string;
  time_slot: string | null;
  notes: string | null;
  unit?: {
    number: string;
    building?: { name: string; address: string };
  };
}

export function useMove() {
  const { user } = useAuth();
  const [move, setMove] = useState<MoveData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMove = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('moves')
      .select(`
        id, type, status, scheduled_date, time_slot, notes,
        unit:units!moves_unit_id_fkey(
          number,
          building:buildings!units_building_id_fkey(name, address)
        )
      `)
      .eq('resident_id', user.id)
      .in('status', ['pending', 'confirmed', 'in_progress'])
      .order('scheduled_date', { ascending: true })
      .limit(1)
      .single();
    setMove(data as MoveData | null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchMove();
  }, [fetchMove]);

  useEffect(() => {
    if (!move?.id) return;

    const channel = supabase
      .channel(`move-status-${move.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'moves', filter: `id=eq.${move.id}` },
        (payload) => {
          setMove((prev) => prev ? { ...prev, status: payload.new.status } : prev);
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [move?.id]);

  return { move, loading, refetch: fetchMove };
}

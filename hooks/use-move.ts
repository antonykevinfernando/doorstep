import { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    async function fetch() {
      const { data } = await supabase
        .from('moves')
        .select(`
          id, type, status, scheduled_date, time_slot, notes,
          unit:units!moves_unit_id_fkey(
            number,
            building:buildings!units_building_id_fkey(name, address)
          )
        `)
        .eq('resident_id', user!.id)
        .in('status', ['pending', 'confirmed', 'in_progress'])
        .order('scheduled_date', { ascending: true })
        .limit(1)
        .single();
      setMove(data as MoveData | null);
      setLoading(false);
    }
    fetch();
  }, [user]);

  return { move, loading };
}

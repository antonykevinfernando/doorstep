import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Mover {
  id: string;
  companyName: string;
  description: string;
  phone: string | null;
  serviceArea: string | null;
  priceRangeMin: number | null;
  priceRangeMax: number | null;
}

export function useMovers() {
  const [movers, setMovers] = useState<Mover[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('movers')
      .select('id, company_name, description, phone, service_area, price_range_min, price_range_max')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    setMovers(
      (data ?? []).map((m: any) => ({
        id: m.id,
        companyName: m.company_name,
        description: m.description,
        phone: m.phone,
        serviceArea: m.service_area,
        priceRangeMin: m.price_range_min,
        priceRangeMax: m.price_range_max,
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { movers, loading, refetch: fetch };
}

export function useMover(id: string) {
  const [mover, setMover] = useState<Mover | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('movers')
        .select('id, company_name, description, phone, service_area, price_range_min, price_range_max')
        .eq('id', id)
        .single();

      if (data) {
        setMover({
          id: data.id,
          companyName: data.company_name,
          description: data.description,
          phone: data.phone,
          serviceArea: data.service_area,
          priceRangeMin: data.price_range_min,
          priceRangeMax: data.price_range_max,
        });
      }
      setLoading(false);
    }
    load();
  }, [id]);

  return { mover, loading };
}

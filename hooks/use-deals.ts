import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Deal {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  originalPrice: number | null;
  dealPrice: number | null;
  discountPct: number | null;
  category: string;
  terms: string | null;
  redemptionCode: string | null;
  redemptionLink: string | null;
  expiresAt: string | null;
  vendor: {
    id: string;
    businessName: string;
    category: string;
  };
}

export function useDeals(category?: string) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('deals')
      .select(`
        id, title, description, image_url, original_price, deal_price,
        discount_pct, category, terms, redemption_code, redemption_link, expires_at,
        vendor:vendors!deals_vendor_id_fkey(id, business_name, category)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data } = await query;
    setDeals(
      (data ?? []).map((d: any) => ({
        id: d.id,
        title: d.title,
        description: d.description,
        imageUrl: d.image_url,
        originalPrice: d.original_price,
        dealPrice: d.deal_price,
        discountPct: d.discount_pct,
        category: d.category,
        terms: d.terms,
        redemptionCode: d.redemption_code,
        redemptionLink: d.redemption_link,
        expiresAt: d.expires_at,
        vendor: {
          id: d.vendor?.id ?? '',
          businessName: d.vendor?.business_name ?? '',
          category: d.vendor?.category ?? '',
        },
      })),
    );
    setLoading(false);
  }, [category]);

  useEffect(() => { fetch(); }, [fetch]);

  return { deals, loading, refetch: fetch };
}

export function useDeal(id: string) {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('deals')
        .select(`
          id, title, description, image_url, original_price, deal_price,
          discount_pct, category, terms, redemption_code, redemption_link, expires_at,
          vendor:vendors!deals_vendor_id_fkey(id, business_name, category)
        `)
        .eq('id', id)
        .single();

      if (data) {
        setDeal({
          id: data.id,
          title: data.title,
          description: data.description,
          imageUrl: data.image_url,
          originalPrice: data.original_price,
          dealPrice: data.deal_price,
          discountPct: data.discount_pct,
          category: data.category,
          terms: data.terms,
          redemptionCode: data.redemption_code,
          redemptionLink: data.redemption_link,
          expiresAt: data.expires_at,
          vendor: {
            id: (data.vendor as any)?.id ?? '',
            businessName: (data.vendor as any)?.business_name ?? '',
            category: (data.vendor as any)?.category ?? '',
          },
        });
      }
      setLoading(false);
    }
    load();
  }, [id]);

  return { deal, loading };
}

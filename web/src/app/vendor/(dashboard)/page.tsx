import { createClient } from '@/lib/supabase/server';
import { DealsView } from './deals/deals-view';

export default async function VendorHomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('user_id', user!.id)
    .single();

  const { data: deals } = vendor
    ? await supabase
        .from('deals')
        .select('*')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false })
    : { data: [] };

  return (
    <DealsView
      vendorId={vendor?.id ?? ''}
      deals={(deals ?? []).map((d: any) => ({
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
        isActive: d.is_active,
        createdAt: d.created_at,
      }))}
    />
  );
}

import { createClient } from '@/lib/supabase/server';
import { MoverProfileView } from './profile-view';

export default async function MoverProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: mover } = await supabase
    .from('movers')
    .select('*')
    .eq('user_id', user!.id)
    .single();

  return (
    <MoverProfileView
      mover={mover ? {
        id: mover.id,
        companyName: mover.company_name,
        description: mover.description,
        phone: mover.phone,
        serviceArea: mover.service_area,
        priceRangeMin: mover.price_range_min,
        priceRangeMax: mover.price_range_max,
      } : null}
    />
  );
}

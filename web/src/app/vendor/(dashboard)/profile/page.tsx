import { createClient } from '@/lib/supabase/server';
import { VendorProfileView } from './profile-view';

export default async function VendorProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: vendor } = await supabase
    .from('vendors')
    .select('*')
    .eq('user_id', user!.id)
    .single();

  return (
    <VendorProfileView
      vendor={vendor ? {
        id: vendor.id,
        businessName: vendor.business_name,
        description: vendor.description,
        category: vendor.category,
        address: vendor.address,
        phone: vendor.phone,
        website: vendor.website,
      } : null}
    />
  );
}

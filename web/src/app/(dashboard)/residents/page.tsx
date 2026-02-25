import { createClient } from '@/lib/supabase/server';
import { ResidentsView } from './residents-view';

export default async function ResidentsPage() {
  const supabase = await createClient();

  const { data: residents } = await supabase
    .from('profiles')
    .select(`
      id, full_name, created_at, approved,
      requested_building_id, requested_unit_number, requested_move_in_date,
      building:buildings!profiles_requested_building_id_fkey(id, name)
    `)
    .eq('role', 'resident')
    .order('created_at', { ascending: false });

  const { data: buildings } = await supabase.from('buildings').select('id, name');

  return (
    <ResidentsView
      residents={(residents ?? []).map((r: any) => ({
        id: r.id,
        fullName: r.full_name || 'Unnamed',
        approved: r.approved,
        buildingId: r.requested_building_id ?? '',
        buildingName: r.building?.name ?? '',
        unitNumber: r.requested_unit_number ?? '',
        moveInDate: r.requested_move_in_date,
        createdAt: r.created_at,
      }))}
      buildings={(buildings ?? []).map((b: any) => ({ id: b.id, name: b.name }))}
    />
  );
}

import { createClient } from '@/lib/supabase/server';
import { DepositsView } from './deposits-view';

export default async function DepositsPage() {
  const supabase = await createClient();

  const { data: deposits } = await supabase
    .from('deposits')
    .select(`
      *,
      task:move_tasks!deposits_task_id_fkey(title, config),
      move:moves!deposits_move_id_fkey(
        scheduled_date,
        resident:profiles!moves_resident_id_fkey(full_name),
        unit:units!moves_unit_id_fkey(
          number,
          building:buildings!units_building_id_fkey(name)
        )
      )
    `)
    .order('created_at', { ascending: false });

  return (
    <DepositsView
      deposits={(deposits ?? []).map((d: any) => ({
        id: d.id,
        amountCents: d.amount_cents,
        status: d.status,
        createdAt: d.created_at,
        residentName: d.move?.resident?.full_name ?? 'Unknown',
        unitNumber: d.move?.unit?.number ?? '',
        buildingName: d.move?.unit?.building?.name ?? '',
        scheduledDate: d.move?.scheduled_date,
      }))}
    />
  );
}

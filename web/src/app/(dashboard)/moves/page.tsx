import { createClient } from '@/lib/supabase/server';
import { MovesView } from './moves-view';
import { CreateMoveDialog } from './create-move-dialog';

export default async function MovesPage() {
  const supabase = await createClient();

  const { data: moves } = await supabase
    .from('moves')
    .select(`
      *,
      resident:profiles!moves_resident_id_fkey(full_name),
      unit:units!moves_unit_id_fkey(number, floor, building_id, building:buildings!units_building_id_fkey(name))
    `)
    .order('scheduled_date', { ascending: false });

  const { data: units } = await supabase
    .from('units')
    .select('id, number, floor, building:buildings!units_building_id_fkey(name)');

  const { data: residents } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'resident');

  const { data: buildings } = await supabase
    .from('buildings')
    .select('id, name');

  const { data: templates } = await supabase
    .from('checklist_templates')
    .select(`
      *,
      items:checklist_template_items(id, title, type, description, config, sort_order)
    `)
    .order('created_at', { ascending: false });

  const { data: taskCounts } = await supabase
    .from('move_tasks')
    .select('move_id');

  const moveTaskMap: Record<string, number> = {};
  for (const t of (taskCounts ?? [])) {
    moveTaskMap[t.move_id] = (moveTaskMap[t.move_id] ?? 0) + 1;
  }

  return (
    <MovesView
      moves={(moves ?? []).map((m: any) => ({
        id: m.id,
        residentName: m.resident?.full_name || '—',
        unitNumber: m.unit?.number || '—',
        buildingName: m.unit?.building?.name || '—',
        buildingId: m.unit?.building_id || '',
        type: m.type,
        scheduledDate: m.scheduled_date,
        status: m.status,
        taskCount: moveTaskMap[m.id] ?? 0,
      }))}
      templates={(templates ?? []).map((t: any) => ({
        id: t.id,
        title: t.title,
        buildingId: t.building_id,
        items: (t.items ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
      }))}
      createDialog={
        <CreateMoveDialog units={units ?? []} residents={residents ?? []} buildings={buildings ?? []} />
      }
    />
  );
}

import { createClient } from '@/lib/supabase/server';
import { ChecklistsView } from './checklists-view';

export default async function ChecklistsPage() {
  const supabase = await createClient();

  const { data: templates } = await supabase
    .from('checklist_templates')
    .select(`
      *,
      building:buildings!checklist_templates_building_id_fkey(name),
      items:checklist_template_items(id, title, type, description, config, sort_order)
    `)
    .order('created_at', { ascending: false });

  const { data: buildings } = await supabase.from('buildings').select('id, name');

  return (
    <ChecklistsView
      templates={(templates ?? []).map((t: any) => ({
        id: t.id,
        title: t.title,
        buildingId: t.building_id,
        buildingName: t.building?.name ?? 'Unknown',
        items: (t.items ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
      }))}
      buildings={(buildings ?? []).map((b: any) => ({ id: b.id, name: b.name }))}
    />
  );
}

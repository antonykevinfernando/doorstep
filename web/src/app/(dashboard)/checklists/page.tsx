import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreateTemplateDialog } from './create-template-dialog';
import { TemplateItems } from './template-items';

export default async function ChecklistsPage() {
  const supabase = await createClient();

  const { data: templates } = await supabase
    .from('checklist_templates')
    .select(`
      *,
      building:buildings!checklist_templates_building_id_fkey(name),
      items:checklist_template_items(id, title, sort_order)
    `)
    .order('created_at', { ascending: false });

  const { data: buildings } = await supabase.from('buildings').select('id, name');

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Checklists</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Templates assigned to buildings
          </p>
        </div>
        <CreateTemplateDialog buildings={buildings ?? []} />
      </div>

      {(!templates || templates.length === 0) && (
        <div className="text-center py-20 text-muted-foreground">
          No checklists yet. Create one to get started.
        </div>
      )}

      <div className="grid gap-6">
        {templates?.map((tmpl: any) => (
          <Card key={tmpl.id} className="bg-white/60 backdrop-blur-sm border-black/5">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-base">{tmpl.title}</CardTitle>
                <Badge variant="secondary" className="mt-1">
                  {tmpl.building?.name || 'No building'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {tmpl.items?.length ?? 0} items
              </p>
            </CardHeader>
            <CardContent>
              <TemplateItems
                templateId={tmpl.id}
                initialItems={(tmpl.items ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order)}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChecklistBuilder } from './checklist-builder';
import {
  FileText,
  ShieldCheck,
  BellRing,
  ArrowUpDown,
  KeyRound,
  DollarSign,
  Pencil,
  Trash2,
  Plus,
  type LucideIcon,
} from 'lucide-react';

const TYPE_ICONS: Record<string, LucideIcon> = {
  upload_lease: FileText,
  upload_insurance: ShieldCheck,
  register_buzzer: BellRing,
  schedule_elevator: ArrowUpDown,
  key_fob_pickup: KeyRound,
  pay_deposit: DollarSign,
};

interface TemplateItem {
  id: string;
  title: string;
  type: string;
  description?: string;
  config?: Record<string, any>;
  sort_order: number;
}

interface Template {
  id: string;
  title: string;
  buildingId: string;
  buildingName: string;
  items: TemplateItem[];
}

interface Props {
  templates: Template[];
  buildings: { id: string; name: string }[];
}

export function ChecklistsView({ templates, buildings }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  function handleEdit(tmpl: Template) {
    setEditingTemplate(tmpl);
    setMode('edit');
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from('checklist_templates').delete().eq('id', id);
    router.refresh();
  }

  if (mode === 'create') {
    return (
      <ChecklistBuilder
        buildings={buildings}
        onClose={() => setMode('list')}
      />
    );
  }

  if (mode === 'edit' && editingTemplate) {
    return (
      <ChecklistBuilder
        buildings={buildings}
        initial={{
          id: editingTemplate.id,
          title: editingTemplate.title,
          buildingId: editingTemplate.buildingId,
          items: editingTemplate.items,
        }}
        onClose={() => { setMode('list'); setEditingTemplate(null); }}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Checklists</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Templates assigned to buildings
          </p>
        </div>
        <Button onClick={() => setMode('create')} className="gap-1.5">
          <Plus size={15} />
          New Checklist
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">No checklists yet.</p>
          <Button variant="link" onClick={() => setMode('create')} className="mt-2">
            Create your first checklist
          </Button>
        </div>
      ) : (
        <div className="grid gap-5">
          {templates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="rounded-xl border border-black/5 bg-white/60 backdrop-blur-sm p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold">{tmpl.title}</h3>
                  <Badge variant="secondary" className="mt-1.5">{tmpl.buildingName}</Badge>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(tmpl)}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(tmpl.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {tmpl.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks in this checklist</p>
              ) : (
                <div className="space-y-1.5">
                  {tmpl.items.map((item, idx) => {
                    const Icon = TYPE_ICONS[item.type] ?? FileText;
                    return (
                      <div key={item.id} className="flex items-start gap-3 py-2">
                        <span className="text-xs text-muted-foreground w-5 text-right tabular-nums mt-0.5">
                          {idx + 1}
                        </span>
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#E8F5DC] mt-0.5">
                          <Icon size={13} className="text-[#30261E]" />
                        </div>
                        <div className="flex-1">
                          <span className="text-sm">{item.title}</span>
                          {item.type === 'pay_deposit' && item.config?.amount_cents && (
                            <span className="text-xs text-muted-foreground ml-1.5">${(item.config.amount_cents / 100).toFixed(0)}</span>
                          )}
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          ))}
        </div>
      )}
    </div>
  );
}

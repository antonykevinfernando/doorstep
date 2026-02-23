'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Send,
  ClipboardCheck,
  Check,
  ChevronDown,
} from 'lucide-react';

interface Move {
  id: string;
  residentName: string;
  unitNumber: string;
  buildingName: string;
  buildingId: string;
  type: string;
  scheduledDate: string;
  status: string;
  taskCount: number;
}

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
  items: TemplateItem[];
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
};

function TemplatePicker({
  templates,
  onSelect,
  sending,
}: {
  templates: Template[];
  onSelect: (tmpl: Template) => void;
  sending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (templates.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">No templates for this building</span>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={sending}
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-50"
      >
        <Send size={12} />
        Send checklist
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+4px)] z-50 min-w-[200px] rounded-lg border border-border bg-white shadow-xl">
          <div className="py-1">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => { onSelect(t); setOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted/60 text-left"
              >
                <ClipboardCheck size={13} className="shrink-0 text-muted-foreground" />
                <span className="truncate">{t.title}</span>
                <span className="ml-auto text-xs text-muted-foreground shrink-0">{t.items.length} tasks</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface Props {
  moves: Move[];
  templates: Template[];
  createDialog: ReactNode;
}

export function MovesView({ moves, templates, createDialog }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const bulkRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bulkOpen) return;
    function handler(e: MouseEvent) {
      if (bulkRef.current?.contains(e.target as Node)) return;
      setBulkOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [bulkOpen]);

  const activeMoves = moves.filter((m) => ['pending', 'confirmed', 'in_progress'].includes(m.status));

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === activeMoves.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(activeMoves.map((m) => m.id)));
    }
  }

  async function applyTemplate(tmpl: Template, moveIds: string[]) {
    setSending(true);
    const supabase = createClient();
    let applied = 0;

    for (const moveId of moveIds) {
      const { data: existing } = await supabase
        .from('move_tasks')
        .select('id')
        .eq('move_id', moveId)
        .limit(1);
      if (existing && existing.length > 0) continue;

      await supabase.from('move_tasks').insert(
        tmpl.items.map((item, idx) => ({
          move_id: moveId,
          title: item.title,
          type: item.type,
          description: item.description || null,
          config: item.config || null,
          sort_order: idx,
        })),
      );
      applied++;
    }

    setSending(false);
    setSelected(new Set());

    if (applied > 0) {
      setFeedback(`Sent "${tmpl.title}" to ${applied} move${applied > 1 ? 's' : ''}`);
    } else {
      setFeedback('Selected moves already have tasks assigned');
    }
    setTimeout(() => setFeedback(null), 3000);
    router.refresh();
  }

  function getTemplatesForBuilding(buildingId: string) {
    return templates.filter((t) => t.buildingId === buildingId);
  }

  function getTemplatesForSelected() {
    const buildingIds = new Set(
      moves.filter((m) => selected.has(m.id)).map((m) => m.buildingId),
    );
    return templates.filter((t) => buildingIds.has(t.buildingId));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Moves</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {moves.length} total move{moves.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selected.size > 0 && (
            <div ref={bulkRef} className="relative">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setBulkOpen(!bulkOpen)}
                disabled={sending}
              >
                <Send size={13} />
                Send checklist to {selected.size} move{selected.size > 1 ? 's' : ''}
                <ChevronDown size={12} className={`transition-transform ${bulkOpen ? 'rotate-180' : ''}`} />
              </Button>
              {bulkOpen && (
                <div className="absolute right-0 top-[calc(100%+4px)] z-50 min-w-[220px] rounded-lg border border-border bg-white shadow-xl">
                  <div className="py-1">
                    {getTemplatesForSelected().length === 0 ? (
                      <p className="px-3 py-2 text-xs text-muted-foreground">No templates match selected buildings</p>
                    ) : (
                      getTemplatesForSelected().map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setBulkOpen(false);
                            applyTemplate(t, Array.from(selected));
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted/60 text-left"
                        >
                          <ClipboardCheck size={13} className="shrink-0 text-muted-foreground" />
                          <span className="truncate">{t.title}</span>
                          <span className="ml-auto text-xs text-muted-foreground shrink-0">{t.items.length} tasks</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          {createDialog}
        </div>
      </div>

      {feedback && (
        <div className="mb-4 rounded-lg border border-[#D2EDBF] bg-[#E8F5DC]/50 px-4 py-2.5 flex items-center gap-2">
          <Check size={14} className="text-[#30261E] shrink-0" />
          <p className="text-sm text-[#30261E]">{feedback}</p>
        </div>
      )}

      <div className="rounded-xl border border-black/5 bg-white/60 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  checked={activeMoves.length > 0 && selected.size === activeMoves.length}
                  onChange={toggleAll}
                  className="rounded border-gray-300 accent-[#30261E]"
                />
              </TableHead>
              <TableHead>Resident</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Building</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Checklist</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {moves.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                  No moves yet. Create one to get started.
                </TableCell>
              </TableRow>
            )}
            {moves.map((move) => {
              const isActive = ['pending', 'confirmed', 'in_progress'].includes(move.status);
              return (
                <TableRow key={move.id}>
                  <TableCell>
                    {isActive && (
                      <input
                        type="checkbox"
                        checked={selected.has(move.id)}
                        onChange={() => toggleSelect(move.id)}
                        className="rounded border-gray-300 accent-[#30261E]"
                      />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{move.residentName}</TableCell>
                  <TableCell>{move.unitNumber}</TableCell>
                  <TableCell>{move.buildingName}</TableCell>
                  <TableCell className="capitalize">{move.type.replace('_', ' ')}</TableCell>
                  <TableCell>
                    {new Date(move.scheduledDate + 'T00:00:00').toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusColors[move.status] ?? ''}>
                      {move.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {move.taskCount > 0 ? (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <ClipboardCheck size={12} />
                        {move.taskCount} task{move.taskCount > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">None</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isActive && move.taskCount === 0 && (
                      <TemplatePicker
                        templates={getTemplatesForBuilding(move.buildingId)}
                        onSelect={(tmpl) => applyTemplate(tmpl, [move.id])}
                        sending={sending}
                      />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

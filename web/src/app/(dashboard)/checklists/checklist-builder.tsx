'use client';

import { useState, useId, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  FileText,
  ShieldCheck,
  BellRing,
  ArrowUpDown,
  KeyRound,
  DollarSign,
  GripVertical,
  X,
  Check,
  ChevronDown,
  ArrowLeft,
  type LucideIcon,
} from 'lucide-react';

/* ── Task type definitions ── */

interface TaskType {
  type: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

const TASK_TYPES: TaskType[] = [
  { type: 'upload_lease', label: 'Upload Lease', description: 'Resident uploads signed lease', icon: FileText },
  { type: 'upload_insurance', label: 'Upload Insurance', description: 'Proof of renter\'s insurance', icon: ShieldCheck },
  { type: 'register_buzzer', label: 'Register Buzzer', description: 'Buzzer code or intercom setup', icon: BellRing },
  { type: 'schedule_elevator', label: 'Schedule Elevator', description: 'Reserve freight elevator slot', icon: ArrowUpDown },
  { type: 'key_fob_pickup', label: 'Key / Fob Pickup', description: 'Collect keys and access fobs', icon: KeyRound },
  { type: 'pay_deposit', label: 'Pay Deposit', description: 'Credit card hold for move-in deposit', icon: DollarSign },
];

/* ── Sortable item ── */

interface SortableItemData {
  id: string;
  type: string;
  label: string;
  description: string;
  icon: LucideIcon;
  config: Record<string, any>;
}

function SortableItem({ item, onRemove, onDescriptionChange, onConfigChange }: {
  item: SortableItemData;
  onRemove: () => void;
  onDescriptionChange: (value: string) => void;
  onConfigChange: (config: Record<string, any>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = item.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg border border-black/5 bg-white/70 px-4 py-3 group space-y-2"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} />
        </button>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#E8F5DC]">
          <Icon size={15} className="text-[#30261E]" />
        </div>
        <span className="text-sm font-medium flex-1">{item.label}</span>
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 text-muted-foreground/40 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
        >
          <X size={15} />
        </button>
      </div>
      <div className="pl-[60px] space-y-1.5">
        <input
          type="text"
          placeholder="Add instructions for the resident..."
          value={item.description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="w-full bg-transparent text-xs text-muted-foreground placeholder:text-muted-foreground/50 outline-none border-b border-transparent focus:border-border pb-1 transition-colors"
        />
        {item.type === 'pay_deposit' && (
          <div className="flex items-center gap-2 pt-1">
            <DollarSign size={13} className="text-muted-foreground shrink-0" />
            <input
              type="number"
              min="1"
              step="1"
              placeholder="Deposit amount (e.g. 500)"
              value={item.config.amount_dollars ?? ''}
              onChange={(e) => onConfigChange({ ...item.config, amount_dollars: e.target.value ? Number(e.target.value) : undefined })}
              className="w-40 bg-transparent text-xs text-muted-foreground placeholder:text-muted-foreground/50 outline-none border-b border-transparent focus:border-border pb-1 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Builder ── */

interface BuilderProps {
  buildings: { id: string; name: string }[];
  initial?: {
    id: string;
    title: string;
    buildingId: string;
    items: { id: string; type: string; title: string; description?: string; config?: Record<string, any>; sort_order: number }[];
  };
  onClose: () => void;
}

function BuildingDropdown({ value, onChange, buildings }: {
  value: string;
  onChange: (v: string) => void;
  buildings: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selected = buildings.find((b) => b.id === value);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (wrapperRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-[42px] w-full items-center justify-between rounded-lg border border-input bg-white px-3 text-sm transition-colors hover:border-foreground/20 focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <span className={`truncate ${selected ? 'text-foreground' : 'text-muted-foreground'}`}>
          {selected?.name ?? 'Select building...'}
        </span>
        <ChevronDown size={15} className={`shrink-0 ml-2 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 rounded-lg border border-border bg-white shadow-xl">
          <div className="max-h-52 overflow-auto py-1">
            {buildings.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => { onChange(b.id); setOpen(false); }}
                className={`flex w-full items-center px-3 py-2 text-sm transition-colors hover:bg-muted/60 ${
                  b.id === value ? 'font-medium text-foreground' : 'text-foreground/80'
                }`}
              >
                <span className="truncate">{b.name}</span>
                {b.id === value && <Check size={13} className="ml-auto shrink-0 text-foreground" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ChecklistBuilder({ buildings, initial, onClose }: BuilderProps) {
  const router = useRouter();
  const prefix = useId();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [buildingId, setBuildingId] = useState(initial?.buildingId ?? '');

  const initialSelected: SortableItemData[] = (initial?.items ?? [])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item) => {
      const def = TASK_TYPES.find((t) => t.type === item.type);
      return {
        id: item.id,
        type: item.type,
        label: def?.label ?? item.title,
        description: item.description ?? '',
        icon: def?.icon ?? FileText,
        config: item.config ?? {},
      };
    });

  const [selected, setSelected] = useState<SortableItemData[]>(initialSelected);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const selectedTypes = new Set(selected.map((s) => s.type));

  function toggleType(taskType: TaskType) {
    if (selectedTypes.has(taskType.type)) {
      setSelected((prev) => prev.filter((s) => s.type !== taskType.type));
    } else {
      setSelected((prev) => [
        ...prev,
        { id: `${prefix}-${taskType.type}`, type: taskType.type, label: taskType.label, description: '', icon: taskType.icon, config: {} },
      ]);
    }
  }

  function updateDescription(id: string, description: string) {
    setSelected((prev) => prev.map((s) => s.id === id ? { ...s, description } : s));
  }

  function updateConfig(id: string, config: Record<string, any>) {
    setSelected((prev) => prev.map((s) => s.id === id ? { ...s, config } : s));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSelected((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  }

  function removeItem(id: string) {
    setSelected((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleSave() {
    if (!title.trim() || !buildingId || selected.length === 0) return;
    setSaving(true);
    const supabase = createClient();

    function itemConfig(item: SortableItemData) {
      if (!item.config || Object.keys(item.config).length === 0) return null;
      if (item.type === 'pay_deposit' && item.config.amount_dollars) {
        return { amount_cents: Math.round(item.config.amount_dollars * 100) };
      }
      return item.config;
    }

    if (initial) {
      await supabase.from('checklist_templates').update({ title, building_id: buildingId }).eq('id', initial.id);
      await supabase.from('checklist_template_items').delete().eq('template_id', initial.id);
      await supabase.from('checklist_template_items').insert(
        selected.map((item, idx) => ({
          template_id: initial.id,
          title: item.label,
          type: item.type,
          description: item.description || null,
          config: itemConfig(item),
          sort_order: idx,
        })),
      );
    } else {
      const { data: tmpl } = await supabase
        .from('checklist_templates')
        .insert({ title, building_id: buildingId })
        .select('id')
        .single();

      if (tmpl) {
        await supabase.from('checklist_template_items').insert(
          selected.map((item, idx) => ({
            template_id: tmpl.id,
            title: item.label,
            type: item.type,
            description: item.description || null,
            config: itemConfig(item),
            sort_order: idx,
          })),
        );
      }
    }

    setSaving(false);
    onClose();
    router.refresh();
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/5 bg-white/60 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <h2 className="text-lg font-semibold tracking-tight">
          {initial ? 'Edit Checklist' : 'New Checklist'}
        </h2>
      </div>

      {/* Title + Building */}
      <div className="rounded-xl border border-black/5 bg-white/60 backdrop-blur-sm p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Checklist name</Label>
            <Input
              placeholder="e.g. Standard Move-In"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-[42px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Building</Label>
            <BuildingDropdown value={buildingId} onChange={setBuildingId} buildings={buildings} />
          </div>
        </div>
      </div>

      {/* Task type palette */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold">Pick tasks</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Click to add or remove from the checklist</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {TASK_TYPES.map((tt) => {
            const isSelected = selectedTypes.has(tt.type);
            const Icon = tt.icon;
            return (
              <button
                key={tt.type}
                type="button"
                onClick={() => toggleType(tt)}
                className={`relative flex flex-col items-start gap-2.5 rounded-xl border p-4 text-left transition-all ${
                  isSelected
                    ? 'border-[#30261E]/20 bg-[#E8F5DC]/50 shadow-sm'
                    : 'border-black/5 bg-white/60 hover:border-black/10 hover:bg-white/80'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#30261E]">
                    <Check size={11} className="text-[#FAF4F3]" strokeWidth={3} />
                  </div>
                )}
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8F5DC]">
                  <Icon size={17} className="text-[#30261E]" />
                </div>
                <div>
                  <p className="text-sm font-medium leading-tight">{tt.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{tt.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sortable list */}
      {selected.length > 0 && (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold">Checklist order</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Drag to reorder tasks</p>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={selected.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {selected.map((item) => (
                  <SortableItem
                    key={item.id}
                    item={item}
                    onRemove={() => removeItem(item.id)}
                    onDescriptionChange={(v) => updateDescription(item.id, v)}
                    onConfigChange={(c) => updateConfig(item.id, c)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Save */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          disabled={saving || !title.trim() || !buildingId || selected.length === 0}
        >
          {saving ? 'Saving...' : initial ? 'Save Changes' : 'Create Checklist'}
        </Button>
      </div>
    </div>
  );
}

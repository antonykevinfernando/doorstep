'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { UserPlus, Users, Copy, Check as CheckIcon, ChevronDown, ArrowRight, CalendarDays, Search } from 'lucide-react';
import { inviteResidentAndCreateMove } from './actions';

/* ── Searchable dropdown (renders in-place, no portal) ── */

interface DropdownOption { value: string; label: string }

function Dropdown({ value, onChange, options, placeholder, searchable = false }: {
  value: string;
  onChange: (v: string) => void;
  options: DropdownOption[];
  placeholder: string;
  searchable?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const selected = options.find((o) => o.value === value);

  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  function close() { setIsOpen(false); setSearch(''); }

  useEffect(() => {
    if (!isOpen) return;
    function handler(e: MouseEvent) {
      if (wrapperRef.current?.contains(e.target as Node)) return;
      close();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchable) {
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [isOpen, searchable]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => isOpen ? close() : setIsOpen(true)}
        className="flex h-[42px] w-full items-center justify-between rounded-lg border border-input bg-white px-3 text-sm transition-colors hover:border-foreground/20 focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <span className={`truncate ${selected ? 'text-foreground' : 'text-muted-foreground'}`}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown size={15} className={`shrink-0 ml-2 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 rounded-lg border border-border bg-white shadow-xl">
          {searchable && (
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <Search size={14} className="shrink-0 text-muted-foreground" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          )}
          <div className="max-h-52 overflow-auto py-1">
            {filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(o.value); close(); }}
                className={`flex w-full items-center px-3 py-2 text-sm transition-colors hover:bg-muted/60 ${
                  o.value === value ? 'font-medium text-foreground' : 'text-foreground/80'
                }`}
              >
                <span className="truncate">{o.label}</span>
                {o.value === value && <CheckIcon size={13} className="ml-auto shrink-0 text-foreground" />}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                {search ? 'No results' : 'No options'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Custom date trigger ── */

function DateInput({ value, onChange, required }: {
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const displayValue = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => inputRef.current?.showPicker()}
        className="flex h-[42px] w-full items-center justify-between rounded-lg border border-input bg-white px-3 text-sm transition-colors hover:border-foreground/20 focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <span className={value ? 'text-foreground' : 'text-muted-foreground'}>{displayValue || 'Pick a date'}</span>
        <CalendarDays size={15} className="text-muted-foreground" />
      </button>
      <input
        ref={inputRef}
        type="date"
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 pointer-events-none"
        tabIndex={-1}
      />
    </div>
  );
}

/* ── Dialog ── */

interface Props {
  units: any[];
  residents: any[];
  buildings: any[];
}

export function CreateMoveDialog({ units, residents, buildings }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState(1);
  const [residentMode, setResidentMode] = useState<'existing' | 'new'>('new');
  const [form, setForm] = useState({
    type: 'move_in',
    resident_id: '',
    unit_id: '',
    building_id: '',
    unit_number: '',
    scheduled_date: '',
    time_slot: '',
    notes: '',
    new_name: '',
    new_email: '',
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function reset() {
    setForm({ type: 'move_in', resident_id: '', unit_id: '', building_id: '', unit_number: '', scheduled_date: '', time_slot: '', notes: '', new_name: '', new_email: '' });
    setResidentMode('new');
    setStep(1);
    setError('');
    setInviteLink('');
    setCopied(false);
  }

  function canAdvance() {
    if (residentMode === 'new') return form.new_name.trim() && form.new_email.trim();
    return !!form.resident_id;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (residentMode === 'new') {
      const result = await inviteResidentAndCreateMove({
        residentName: form.new_name,
        residentEmail: form.new_email,
        buildingId: form.building_id,
        unitNumber: form.unit_number,
        type: form.type as 'move_in' | 'move_out',
        scheduledDate: form.scheduled_date,
        timeSlot: form.time_slot || undefined,
        notes: form.notes || undefined,
      });

      setLoading(false);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.inviteLink) {
        setInviteLink(result.inviteLink);
        router.refresh();
        return;
      }
    } else {
      const supabase = createClient();
      const { error: moveError } = await supabase.from('moves').insert({
        type: form.type,
        resident_id: form.resident_id,
        unit_id: form.unit_id,
        scheduled_date: form.scheduled_date,
        time_slot: form.time_slot || null,
        notes: form.notes || null,
      });

      setLoading(false);
      if (moveError) {
        setError(moveError.message);
        return;
      }
    }

    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button>New Move</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px] gap-0 p-0 overflow-visible">
        {inviteLink ? (
          <div className="p-6 space-y-4">
            <DialogHeader>
              <DialogTitle>Move created</DialogTitle>
              <DialogDescription>
                Share this link with <span className="font-medium text-foreground">{form.new_name}</span> so they can set up their account.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={inviteLink}
                className="text-xs h-10"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="shrink-0 gap-1.5 h-10 px-3"
                onClick={() => {
                  navigator.clipboard.writeText(inviteLink);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? <CheckIcon size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <Button className="w-full" onClick={() => { setOpen(false); reset(); }}>
              Done
            </Button>
          </div>
        ) : (
          <div className="p-6">
            {/* Step dots */}
            <div className="flex items-center justify-center gap-1.5 mb-5">
              <div className="h-1.5 w-1.5 rounded-full bg-foreground" />
              <div className={`h-1.5 w-1.5 rounded-full transition-colors ${step === 2 ? 'bg-foreground' : 'bg-border'}`} />
            </div>

            <DialogHeader className="mb-5">
              <DialogTitle>{step === 1 ? "Who's moving?" : 'Move details'}</DialogTitle>
            </DialogHeader>

            {step === 1 ? (
              <div className="space-y-4">
                <div className="flex gap-1 rounded-lg bg-muted/60 p-1">
                  <button
                    type="button"
                    onClick={() => setResidentMode('new')}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      residentMode === 'new'
                        ? 'bg-white shadow-sm text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <UserPlus size={14} />
                    Invite new
                  </button>
                  {residents.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setResidentMode('existing')}
                      className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        residentMode === 'existing'
                          ? 'bg-white shadow-sm text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Users size={14} />
                      Existing
                    </button>
                  )}
                </div>

                {residentMode === 'new' ? (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Full name</Label>
                      <Input placeholder="Jane Doe" value={form.new_name} onChange={(e) => update('new_name', e.target.value)} className="h-[42px]" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <Input type="email" placeholder="jane@example.com" value={form.new_email} onChange={(e) => update('new_email', e.target.value)} className="h-[42px]" />
                    </div>
                    <p className="text-xs text-muted-foreground">You'll get an invite link to share with them.</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Resident</Label>
                    <Dropdown
                      value={form.resident_id}
                      onChange={(v) => update('resident_id', v)}
                      placeholder="Select resident..."
                      options={residents.map((r: any) => ({ value: r.id, label: r.full_name || r.id }))}
                      searchable
                    />
                  </div>
                )}

                <Button
                  type="button"
                  className="w-full gap-1.5"
                  disabled={!canAdvance()}
                  onClick={() => setStep(2)}
                >
                  Continue
                  <ArrowRight size={15} />
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <div className="flex gap-1 rounded-lg bg-muted/60 p-1">
                    {(['move_in', 'move_out'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => update('type', t)}
                        className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                          form.type === t
                            ? 'bg-white shadow-sm text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {t === 'move_in' ? 'Move in' : 'Move out'}
                      </button>
                    ))}
                  </div>
                </div>

                {residentMode === 'new' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Building</Label>
                      <Dropdown
                        value={form.building_id}
                        onChange={(v) => update('building_id', v)}
                        placeholder="Select..."
                        options={buildings.map((b: any) => ({ value: b.id, label: b.name }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Unit</Label>
                      <Input placeholder="e.g. 204" value={form.unit_number} onChange={(e) => update('unit_number', e.target.value)} required className="h-[42px]" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Unit</Label>
                    <Dropdown
                      value={form.unit_id}
                      onChange={(v) => update('unit_id', v)}
                      placeholder="Select unit..."
                      options={units.map((u: any) => ({
                        value: u.id,
                        label: `${u.building?.name} — Unit ${u.number}`,
                      }))}
                      searchable
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Date</Label>
                    <DateInput value={form.scheduled_date} onChange={(v) => update('scheduled_date', v)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Time slot</Label>
                    <Input placeholder="e.g. 9–12 AM" value={form.time_slot} onChange={(e) => update('time_slot', e.target.value)} className="h-[42px]" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Notes <span className="text-muted-foreground/60">(optional)</span></Label>
                  <Textarea placeholder="Special instructions..." value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={2} />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <div className="flex gap-2 pt-1">
                  <Button type="button" variant="ghost" className="flex-1" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-[2]">
                    {loading
                      ? 'Creating...'
                      : residentMode === 'new'
                        ? 'Invite & Create'
                        : 'Create Move'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

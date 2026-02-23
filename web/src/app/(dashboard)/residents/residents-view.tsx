'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { UserPlus, Copy, Check, ChevronDown, Search } from 'lucide-react';
import { inviteResident } from './actions';

interface Resident {
  id: string;
  fullName: string;
  approved: boolean;
  buildingName: string;
  unitNumber: string;
  moveInDate: string | null;
  createdAt: string;
}

interface Building {
  id: string;
  name: string;
}

function BuildingDropdown({ value, onChange, buildings }: {
  value: string;
  onChange: (v: string) => void;
  buildings: Building[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = buildings.find((b) => b.id === value);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-[42px] w-full items-center justify-between rounded-lg border border-input bg-white px-3 text-sm transition-colors hover:border-foreground/20 focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <span className={selected ? 'text-foreground' : 'text-muted-foreground'}>
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

function InviteResidentDialog({ buildings }: { buildings: Building[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    building_id: '',
    unit_number: '',
    scheduled_date: '',
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function reset() {
    setForm({ name: '', email: '', building_id: '', unit_number: '', scheduled_date: '' });
    setError('');
    setInviteLink('');
    setCopied(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await inviteResident({
      residentName: form.name,
      residentEmail: form.email,
      buildingId: form.building_id,
      unitNumber: form.unit_number,
      scheduledDate: form.scheduled_date,
    });

    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.inviteLink) {
      setInviteLink(result.inviteLink);
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button className="gap-1.5">
          <UserPlus size={15} />
          Invite Resident
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px] gap-0 p-0 overflow-visible">
        {inviteLink ? (
          <div className="p-6 space-y-4">
            <DialogHeader>
              <DialogTitle>Resident invited</DialogTitle>
              <DialogDescription>
                Share this link with <span className="font-medium text-foreground">{form.name}</span> so they can set up their account.
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
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <Button className="w-full" onClick={() => { setOpen(false); reset(); }}>
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <DialogHeader className="mb-1">
              <DialogTitle>Invite Resident</DialogTitle>
              <DialogDescription>
                Create a move-in and send them a signup link.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Full name</Label>
                <Input placeholder="Jane Doe" value={form.name} onChange={(e) => update('name', e.target.value)} required className="h-[42px]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Email</Label>
                <Input type="email" placeholder="jane@example.com" value={form.email} onChange={(e) => update('email', e.target.value)} required className="h-[42px]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Building</Label>
                <BuildingDropdown value={form.building_id} onChange={(v) => update('building_id', v)} buildings={buildings} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Unit</Label>
                <Input placeholder="e.g. 204" value={form.unit_number} onChange={(e) => update('unit_number', e.target.value)} required className="h-[42px]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Move-in date</Label>
              <Input type="date" value={form.scheduled_date} onChange={(e) => update('scheduled_date', e.target.value)} required className="h-[42px]" />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Inviting...' : 'Invite & Create Move'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface Props {
  residents: Resident[];
  buildings: Building[];
}

export function ResidentsView({ residents, buildings }: Props) {
  const [search, setSearch] = useState('');

  const filtered = search
    ? residents.filter((r) =>
        r.fullName.toLowerCase().includes(search.toLowerCase()) ||
        r.buildingName.toLowerCase().includes(search.toLowerCase()) ||
        r.unitNumber.toLowerCase().includes(search.toLowerCase())
      )
    : residents;

  const invited = filtered.filter((r) => !r.approved);
  const active = filtered.filter((r) => r.approved);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Residents</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {residents.length} resident{residents.length !== 1 ? 's' : ''}
          </p>
        </div>
        <InviteResidentDialog buildings={buildings} />
      </div>

      {residents.length > 5 && (
        <div className="relative mb-6 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search residents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
      )}

      <div className="rounded-xl border border-black/5 bg-white/60 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Building</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Move-in</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Added</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  {search ? 'No residents match your search.' : 'No residents yet. Invite one to get started.'}
                </TableCell>
              </TableRow>
            )}
            {invited.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.fullName}</TableCell>
                <TableCell>{r.buildingName || '—'}</TableCell>
                <TableCell>{r.unitNumber || '—'}</TableCell>
                <TableCell>
                  {r.moveInDate
                    ? new Date(r.moveInDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : '—'}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
                    Invited
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </TableCell>
              </TableRow>
            ))}
            {active.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.fullName}</TableCell>
                <TableCell>{r.buildingName || '—'}</TableCell>
                <TableCell>{r.unitNumber || '—'}</TableCell>
                <TableCell>
                  {r.moveInDate
                    ? new Date(r.moveInDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : '—'}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                    Active
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

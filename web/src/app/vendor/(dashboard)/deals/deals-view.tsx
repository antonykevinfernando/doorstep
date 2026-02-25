'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Plus, Pencil, Trash2, Eye, EyeOff, ChevronDown, Check } from 'lucide-react';

const CATEGORIES = [
  'Food & Dining',
  'Cleaning',
  'Furniture',
  'Fitness',
  'Home Services',
  'Moving Supplies',
  'Electronics',
  'Other',
];

function CategoryDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm transition-colors hover:border-foreground/20 focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
          {value || 'Select a category...'}
        </span>
        <ChevronDown size={15} className={`shrink-0 ml-2 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 rounded-lg border border-border bg-white shadow-xl">
          <div className="max-h-52 overflow-auto py-1">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => { onChange(c); setOpen(false); }}
                className={`flex w-full items-center px-3 py-2 text-sm transition-colors hover:bg-muted/60 ${
                  c === value ? 'font-medium text-foreground' : 'text-foreground/80'
                }`}
              >
                <span className="truncate">{c}</span>
                {c === value && <Check size={13} className="ml-auto shrink-0 text-foreground" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface Deal {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  originalPrice: number | null;
  dealPrice: number | null;
  discountPct: number | null;
  category: string;
  terms: string | null;
  redemptionCode: string | null;
  redemptionLink: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

function DealFormDialog({
  vendorId,
  deal,
  open,
  onOpenChange,
}: {
  vendorId: string;
  deal?: Deal;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: deal?.title ?? '',
    description: deal?.description ?? '',
    originalPrice: deal?.originalPrice?.toString() ?? '',
    dealPrice: deal?.dealPrice?.toString() ?? '',
    discountPct: deal?.discountPct?.toString() ?? '',
    category: deal?.category ?? 'Food & Dining',
    terms: deal?.terms ?? '',
    redemptionCode: deal?.redemptionCode ?? '',
    redemptionLink: deal?.redemptionLink ?? '',
    expiresAt: deal?.expiresAt ? deal.expiresAt.split('T')[0] : '',
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    const payload = {
      vendor_id: vendorId,
      title: form.title,
      description: form.description,
      original_price: form.originalPrice ? parseFloat(form.originalPrice) : null,
      deal_price: form.dealPrice ? parseFloat(form.dealPrice) : null,
      discount_pct: form.discountPct ? parseInt(form.discountPct) : null,
      category: form.category,
      terms: form.terms || null,
      redemption_code: form.redemptionCode || null,
      redemption_link: form.redemptionLink || null,
      expires_at: form.expiresAt ? new Date(form.expiresAt + 'T23:59:59').toISOString() : null,
    };

    if (deal) {
      await supabase.from('deals').update(payload).eq('id', deal.id);
    } else {
      await supabase.from('deals').insert(payload);
    }

    setLoading(false);
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{deal ? 'Edit Deal' : 'Create Deal'}</DialogTitle>
          <DialogDescription>
            {deal ? 'Update your deal details.' : 'Create a new deal for residents to discover.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Title</Label>
            <Input value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="e.g. 20% off first cleaning" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Description</Label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Describe your deal..."
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Original price</Label>
              <Input type="number" step="0.01" value={form.originalPrice} onChange={(e) => update('originalPrice', e.target.value)} placeholder="$0.00" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Deal price</Label>
              <Input type="number" step="0.01" value={form.dealPrice} onChange={(e) => update('dealPrice', e.target.value)} placeholder="$0.00" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Discount %</Label>
              <Input type="number" value={form.discountPct} onChange={(e) => update('discountPct', e.target.value)} placeholder="e.g. 20" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Category</Label>
              <CategoryDropdown value={form.category} onChange={(v) => update('category', v)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Expires on</Label>
              <Input type="date" value={form.expiresAt} onChange={(e) => update('expiresAt', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Terms & conditions</Label>
            <textarea
              value={form.terms}
              onChange={(e) => update('terms', e.target.value)}
              placeholder="e.g. Valid for new customers only..."
              rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Redemption code</Label>
              <Input value={form.redemptionCode} onChange={(e) => update('redemptionCode', e.target.value)} placeholder="e.g. WELCOME20" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Redemption link</Label>
              <Input value={form.redemptionLink} onChange={(e) => update('redemptionLink', e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Saving...' : deal ? 'Save Changes' : 'Create Deal'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface Props {
  vendorId: string;
  deals: Deal[];
}

export function DealsView({ vendorId, deals }: Props) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editDeal, setEditDeal] = useState<Deal | null>(null);

  async function toggleActive(deal: Deal) {
    const supabase = createClient();
    await supabase.from('deals').update({ is_active: !deal.isActive }).eq('id', deal.id);
    router.refresh();
  }

  async function deleteDeal(id: string) {
    const supabase = createClient();
    await supabase.from('deals').delete().eq('id', id);
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your Deals</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {deals.length} deal{deals.length !== 1 ? 's' : ''} · {deals.filter((d) => d.isActive).length} active
          </p>
        </div>
        <Button className="gap-1.5" onClick={() => setCreateOpen(true)}>
          <Plus size={15} />
          Create Deal
        </Button>
      </div>

      <div className="rounded-xl border border-black/5 bg-white/60 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Deal</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {deals.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No deals yet. Create your first one to reach residents.
                </TableCell>
              </TableRow>
            )}
            {deals.map((deal) => (
              <TableRow key={deal.id}>
                <TableCell>
                  <p className="font-medium">{deal.title}</p>
                  {deal.description && (
                    <p className="text-xs text-muted-foreground truncate max-w-[240px]">{deal.description}</p>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{deal.category}</Badge>
                </TableCell>
                <TableCell>
                  {deal.dealPrice != null ? (
                    <span className="text-sm">
                      {deal.originalPrice != null && (
                        <span className="line-through text-muted-foreground mr-1">${deal.originalPrice}</span>
                      )}
                      <span className="font-medium">${deal.dealPrice}</span>
                    </span>
                  ) : deal.discountPct ? (
                    <span className="text-sm font-medium">{deal.discountPct}% off</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {deal.expiresAt
                    ? new Date(deal.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'No expiry'}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={deal.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}>
                    {deal.isActive ? 'Active' : 'Hidden'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => toggleActive(deal)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors" title={deal.isActive ? 'Hide' : 'Show'}>
                      {deal.isActive ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                    <button onClick={() => setEditDeal(deal)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => deleteDeal(deal.id)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DealFormDialog vendorId={vendorId} open={createOpen} onOpenChange={setCreateOpen} />
      {editDeal && (
        <DealFormDialog vendorId={vendorId} deal={editDeal} open={!!editDeal} onOpenChange={(v) => { if (!v) setEditDeal(null); }} />
      )}
    </div>
  );
}

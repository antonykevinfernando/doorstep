'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Check, ChevronDown } from 'lucide-react';

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

interface VendorData {
  id: string;
  businessName: string;
  description: string;
  category: string;
  address: string;
  phone: string | null;
  website: string | null;
}

export function VendorProfileView({ vendor }: { vendor: VendorData | null }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    businessName: vendor?.businessName ?? '',
    description: vendor?.description ?? '',
    category: vendor?.category ?? 'Food & Dining',
    address: vendor?.address ?? '',
    phone: vendor?.phone ?? '',
    website: vendor?.website ?? '',
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!vendor) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from('vendors').update({
      business_name: form.businessName,
      description: form.description,
      category: form.category,
      address: form.address,
      phone: form.phone || null,
      website: form.website || null,
    }).eq('id', vendor.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }

  if (!vendor) {
    return <p className="text-muted-foreground">Vendor profile not found.</p>;
  }

  return (
    <div className="max-w-xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Business Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Update how your business appears to residents.</p>
      </div>

      <div className="rounded-xl border border-black/5 bg-white/60 backdrop-blur-sm p-7 space-y-5">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Business name</Label>
          <Input value={form.businessName} onChange={(e) => update('businessName', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Category</Label>
          <CategoryDropdown value={form.category} onChange={(v) => update('category', v)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Description</Label>
          <textarea
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            rows={4}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Phone</Label>
            <Input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="(555) 123-4567" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Address</Label>
            <Input value={form.address} onChange={(e) => update('address', e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Website</Label>
          <Input value={form.website} onChange={(e) => update('website', e.target.value)} placeholder="https://..." />
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-1.5">
          {saved ? <><Check size={14} /> Saved</> : saving ? 'Saving...' : <><Save size={14} /> Save Changes</>}
        </Button>
      </div>
    </div>
  );
}

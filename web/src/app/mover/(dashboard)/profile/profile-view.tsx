'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Check } from 'lucide-react';

interface MoverData {
  id: string;
  companyName: string;
  description: string;
  phone: string | null;
  serviceArea: string | null;
  priceRangeMin: number | null;
  priceRangeMax: number | null;
}

export function MoverProfileView({ mover }: { mover: MoverData | null }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    companyName: mover?.companyName ?? '',
    description: mover?.description ?? '',
    phone: mover?.phone ?? '',
    serviceArea: mover?.serviceArea ?? '',
    priceRangeMin: mover?.priceRangeMin?.toString() ?? '',
    priceRangeMax: mover?.priceRangeMax?.toString() ?? '',
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!mover) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from('movers').update({
      company_name: form.companyName,
      description: form.description,
      phone: form.phone || null,
      service_area: form.serviceArea || null,
      price_range_min: form.priceRangeMin ? parseFloat(form.priceRangeMin) : null,
      price_range_max: form.priceRangeMax ? parseFloat(form.priceRangeMax) : null,
    }).eq('id', mover.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }

  if (!mover) {
    return <p className="text-muted-foreground">Mover profile not found.</p>;
  }

  return (
    <div className="max-w-xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Company Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Update how your company appears to residents.</p>
      </div>

      <div className="rounded-xl border border-black/5 bg-white/60 backdrop-blur-sm p-7 space-y-5">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Company name</Label>
          <Input value={form.companyName} onChange={(e) => update('companyName', e.target.value)} />
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
            <Label className="text-xs text-muted-foreground">Service area</Label>
            <Input value={form.serviceArea} onChange={(e) => update('serviceArea', e.target.value)} placeholder="e.g. Downtown Toronto" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Min price / hr</Label>
            <Input type="number" step="1" value={form.priceRangeMin} onChange={(e) => update('priceRangeMin', e.target.value)} placeholder="$60" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Max price / hr</Label>
            <Input type="number" step="1" value={form.priceRangeMax} onChange={(e) => update('priceRangeMax', e.target.value)} placeholder="$120" />
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-1.5">
          {saved ? <><Check size={14} /> Saved</> : saving ? 'Saving...' : <><Save size={14} /> Save Changes</>}
        </Button>
      </div>
    </div>
  );
}

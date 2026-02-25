'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Building2, ChevronRight } from 'lucide-react';
import { AddressSearch } from '@/components/address-search';

interface BuildingItem {
  id: string;
  name: string;
  address: string;
}

interface Props {
  buildings: BuildingItem[];
  orgId: string;
}

export function BuildingsSection({ buildings: initial, orgId }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');

  async function handleAdd() {
    if (!newName.trim() || !newAddress.trim()) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from('buildings').insert({ org_id: orgId, name: newName, address: newAddress });
    setSaving(false);
    setAdding(false);
    setNewName('');
    setNewAddress('');
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-black/5 bg-white/60 backdrop-blur-sm p-7">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold">Buildings</h2>
        {!adding && (
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => setAdding(true)}>
            <Plus size={14} />
            Add building
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {initial.length === 0 && !adding && (
          <p className="text-sm text-muted-foreground py-4 text-center">No buildings yet. Add your first one above.</p>
        )}

        {initial.map((b) => (
          <Link
            key={b.id}
            href={`/settings/buildings/${b.id}`}
            className="rounded-lg border border-black/5 bg-white/50 px-5 py-4 flex items-center gap-4 hover:bg-white/80 transition-colors block"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted/60 shrink-0">
              <Building2 size={16} className="text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{b.name}</p>
              <p className="text-xs text-muted-foreground truncate">{b.address || 'No address'}</p>
            </div>
            <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
          </Link>
        ))}

        {adding && (
          <div className="rounded-lg border border-dashed border-foreground/15 bg-white/40 px-5 py-4 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Building name</Label>
              <Input placeholder="e.g. Maple Tower" value={newName} onChange={(e) => setNewName(e.target.value)} className="h-[42px]" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Address</Label>
              <AddressSearch
                value={newAddress}
                onChange={(address, name) => {
                  setNewAddress(address);
                  if (name && !newName) setNewName(name);
                }}
              />
            </div>
            <div className="flex gap-1.5 justify-end">
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => { setAdding(false); setNewName(''); setNewAddress(''); }}>
                Cancel
              </Button>
              <Button size="sm" className="gap-1.5" onClick={handleAdd} disabled={saving || !newName.trim() || !newAddress.trim()}>
                <Plus size={14} />
                {saving ? 'Adding...' : 'Add'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

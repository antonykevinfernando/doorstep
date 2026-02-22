'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Save, X, Building2, Trash2 } from 'lucide-react';
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');

  function startEdit(b: BuildingItem) {
    setEditingId(b.id);
    setEditName(b.name);
    setEditAddress(b.address);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName('');
    setEditAddress('');
  }

  async function handleSave(id: string) {
    setSaving(true);
    const supabase = createClient();
    await supabase.from('buildings').update({ name: editName, address: editAddress }).eq('id', id);
    setSaving(false);
    cancelEdit();
    router.refresh();
  }

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

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from('buildings').delete().eq('id', id);
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
          <div key={b.id} className="rounded-lg border border-black/5 bg-white/50 px-5 py-4">
            {editingId === b.id ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Name</Label>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-[42px]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Address</Label>
                  <AddressSearch
                    value={editAddress}
                    onChange={(address, name) => {
                      setEditAddress(address);
                      if (name && !editName) setEditName(name);
                    }}
                  />
                </div>
                <div className="flex gap-1.5 justify-end">
                  <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={cancelEdit}>
                    <X size={14} />
                  </Button>
                  <Button size="sm" className="gap-1.5" onClick={() => handleSave(b.id)} disabled={saving || !editName.trim()}>
                    <Save size={14} />
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted/60 shrink-0">
                  <Building2 size={16} className="text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{b.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{b.address || 'No address'}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="sm" className="text-muted-foreground h-8 w-8 p-0" onClick={() => startEdit(b)}>
                    <Pencil size={13} />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive h-8 w-8 p-0" onClick={() => handleDelete(b.id)}>
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
            )}
          </div>
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

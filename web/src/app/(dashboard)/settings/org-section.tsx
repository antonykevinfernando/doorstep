'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pencil, Save, X } from 'lucide-react';

interface Props {
  org: { id: string; name: string; slug: string };
}

export function OrgSection({ org }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(org.name);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    await supabase.from('organizations').update({ name }).eq('id', org.id);
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-black/5 bg-white/60 backdrop-blur-sm p-7">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold">Organization</h2>
        {!editing ? (
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => setEditing(true)}>
            <Pencil size={14} />
            Edit
          </Button>
        ) : (
          <div className="flex gap-1.5">
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => { setEditing(false); setName(org.name); }}>
              <X size={14} />
            </Button>
            <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={saving || !name.trim()}>
              <Save size={14} />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Company / management name</Label>
          {editing ? (
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-[42px]" />
          ) : (
            <p className="text-sm font-medium py-2.5">{org.name}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Slug</Label>
          <p className="text-sm font-medium py-2.5 text-foreground/70">{org.slug}</p>
        </div>
      </div>
    </div>
  );
}

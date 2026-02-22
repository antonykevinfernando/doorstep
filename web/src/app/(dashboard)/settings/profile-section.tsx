'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pencil, Save, X } from 'lucide-react';

interface Props {
  profile: { fullName: string; email: string; role: string };
}

export function ProfileSection({ profile }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState(profile.fullName);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id);
    }
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-black/5 bg-white/60 backdrop-blur-sm p-7">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold">Profile</h2>
        {!editing ? (
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => setEditing(true)}>
            <Pencil size={14} />
            Edit
          </Button>
        ) : (
          <div className="flex gap-1.5">
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => { setEditing(false); setFullName(profile.fullName); }}>
              <X size={14} />
            </Button>
            <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={saving || !fullName.trim()}>
              <Save size={14} />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Full name</Label>
          {editing ? (
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-[42px]" />
          ) : (
            <p className="text-sm font-medium py-2.5">{profile.fullName || '—'}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Email</Label>
          <p className="text-sm font-medium py-2.5 text-foreground/70">{profile.email}</p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Role</Label>
          <p className="text-sm font-medium py-2.5 capitalize">{profile.role}</p>
        </div>
      </div>
    </div>
  );
}

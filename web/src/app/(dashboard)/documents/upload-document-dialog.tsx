'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';

interface Props {
  buildings: any[];
  moves: any[];
}

export function UploadDocumentDialog({ buildings, moves }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [assignType, setAssignType] = useState<'building' | 'move'>('building');
  const [assignId, setAssignId] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setLoading(true);
    const supabase = createClient();
    const path = `${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(path, file);

    if (uploadError) {
      setLoading(false);
      return;
    }

    await supabase.from('documents').insert({
      title: title || file.name,
      file_path: path,
      file_size: file.size,
      building_id: assignType === 'building' ? assignId || null : null,
      move_id: assignType === 'move' ? assignId || null : null,
    });

    setLoading(false);
    setOpen(false);
    setTitle('');
    setAssignId('');
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Upload</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>File</Label>
            <Input type="file" ref={fileRef} required />
          </div>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input placeholder="Optional title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Assign to</Label>
            <div className="flex gap-2 mb-2">
              <Button type="button" size="sm" variant={assignType === 'building' ? 'default' : 'outline'} onClick={() => { setAssignType('building'); setAssignId(''); }}>
                Building
              </Button>
              <Button type="button" size="sm" variant={assignType === 'move' ? 'default' : 'outline'} onClick={() => { setAssignType('move'); setAssignId(''); }}>
                Move
              </Button>
            </div>
            <select
              className="w-full rounded-md border px-3 py-2 text-sm bg-white"
              value={assignId}
              onChange={(e) => setAssignId(e.target.value)}
            >
              <option value="">Select...</option>
              {assignType === 'building'
                ? buildings.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)
                : moves.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.resident?.full_name || 'Resident'} — {new Date(m.scheduled_date).toLocaleDateString()}
                    </option>
                  ))
              }
            </select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

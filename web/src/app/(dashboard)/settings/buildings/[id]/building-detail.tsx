'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
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
  DialogDescription,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Pencil,
  Save,
  X,
  FileText,
  Plus,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { AddressSearch } from '@/components/address-search';
import { ElevatorManager } from '@/app/(dashboard)/elevator/elevator-manager';

interface Building {
  id: string;
  name: string;
  address: string;
}

interface Doc {
  id: string;
  title: string;
  filePath: string;
  fileSize: number | null;
  createdAt: string;
}

function formatBytes(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DetailsSection({ building }: { building: Building }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(building.name);
  const [address, setAddress] = useState(building.address);
  const [saving, setSaving] = useState(false);

  function cancel() {
    setEditing(false);
    setName(building.name);
    setAddress(building.address);
  }

  async function save() {
    setSaving(true);
    const supabase = createClient();
    await supabase.from('buildings').update({ name, address }).eq('id', building.id);
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-black/5 bg-white/60 backdrop-blur-sm p-7">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold">Details</h2>
        {!editing && (
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => setEditing(true)}>
            <Pencil size={13} />
            Edit
          </Button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-[42px]" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Address</Label>
            <AddressSearch
              value={address}
              onChange={(addr, n) => {
                setAddress(addr);
                if (n && !name) setName(n);
              }}
            />
          </div>
          <div className="flex gap-1.5 justify-end">
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={cancel}>
              <X size={14} />
            </Button>
            <Button size="sm" className="gap-1.5" onClick={save} disabled={saving || !name.trim()}>
              <Save size={14} />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <p className="text-sm font-medium">{building.name}</p>
          <p className="text-sm text-muted-foreground">{building.address || 'No address'}</p>
        </div>
      )}
    </div>
  );
}

function UploadDialog({ buildingId }: { buildingId: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');

  function reset() {
    setTitle('');
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setLoading(true);
    const supabase = createClient();
    const path = `building/${buildingId}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage.from('documents').upload(path, file);
    if (uploadError) { setLoading(false); return; }

    await supabase.from('documents').insert({
      title: title || file.name,
      file_path: path,
      file_size: file.size,
      building_id: buildingId,
    });

    setLoading(false);
    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus size={14} />
          Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>Upload Building Info</DialogTitle>
          <DialogDescription>
            This will appear in the Building Info tab for residents.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">File</Label>
            <Input type="file" ref={fileRef} required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Title</Label>
            <Input placeholder="e.g. Welcome Guide" value={title} onChange={(e) => setTitle(e.target.value)} className="h-[42px]" />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Uploading...' : 'Upload'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BuildingInfoSection({ buildingId, documents }: { buildingId: string; documents: Doc[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  async function openFile(filePath: string) {
    const supabase = createClient();
    const { data } = await supabase.storage.from('documents').createSignedUrl(filePath, 300);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  }

  async function deleteDoc(id: string, filePath: string) {
    setDeleting(id);
    const supabase = createClient();
    await supabase.storage.from('documents').remove([filePath]);
    await supabase.from('documents').delete().eq('id', id);
    setDeleting(null);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-black/5 bg-white/60 backdrop-blur-sm p-7">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold">Building Info</h2>
        <UploadDialog buildingId={buildingId} />
      </div>

      {documents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/10 bg-white/40 p-8 text-center">
          <FileText size={24} className="mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">No building documents yet. Upload one to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="rounded-lg border border-black/5 bg-white/50 p-4 flex items-center gap-3"
            >
              <button
                onClick={() => openFile(doc.filePath)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black/[0.03] hover:bg-black/[0.06] transition-colors"
              >
                <FileText size={15} className="text-[#30261E]" />
              </button>
              <div className="flex-1 min-w-0">
                <button onClick={() => openFile(doc.filePath)} className="text-sm font-medium truncate block text-left hover:underline">
                  {doc.title}
                </button>
                <p className="text-xs text-muted-foreground">
                  {new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {doc.fileSize ? ` · ${formatBytes(doc.fileSize)}` : ''}
                </p>
              </div>
              <button
                onClick={() => deleteDoc(doc.id, doc.filePath)}
                disabled={deleting === doc.id}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface Props {
  building: Building;
  documents: Doc[];
}

export function BuildingDetail({ building, documents }: Props) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/settings"
          className="flex items-center justify-center h-9 w-9 rounded-lg border border-black/5 bg-white/60 hover:bg-white/80 transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{building.name}</h1>
          {building.address && (
            <p className="text-sm text-muted-foreground mt-0.5">{building.address}</p>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <DetailsSection building={building} />
        <BuildingInfoSection buildingId={building.id} documents={documents} />
        <div className="rounded-xl border border-black/5 bg-white/60 backdrop-blur-sm p-7">
          <h2 className="text-lg font-semibold mb-5">Elevator Scheduling</h2>
          <ElevatorManager buildings={[]} initialBuildingId={building.id} />
        </div>
      </div>
    </div>
  );
}

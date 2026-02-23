'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Check,
  Circle,
  FileText,
  Upload,
  ShieldCheck,
  BellRing,
  KeyRound,
  ArrowUpDown,
  DollarSign,
  ExternalLink,
  ArrowDownToLine,
  Undo2,
  Clock,
} from 'lucide-react';

interface MoveData {
  id: string;
  type: string;
  status: string;
  scheduledDate: string;
  timeSlot: string | null;
  notes: string | null;
  createdAt: string;
  residentName: string;
  residentId: string;
  unitNumber: string;
  buildingName: string;
  buildingId: string;
}

interface Task {
  id: string;
  title: string;
  type: string | null;
  description: string | null;
  completed: boolean;
  completedAt: string | null;
  response: Record<string, any> | null;
}

interface Document {
  id: string;
  title: string;
  filePath: string;
  fileSize: number | null;
  createdAt: string;
}

interface ElevatorSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface Deposit {
  id: string;
  amountCents: number;
  status: string;
  createdAt: string;
}

interface Props {
  move: MoveData;
  tasks: Task[];
  documents: Document[];
  elevatorSlots: ElevatorSlot[];
  deposits: Deposit[];
}

const statusFlow = ['pending', 'confirmed', 'in_progress', 'completed'] as const;
const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
};

const TASK_ICONS: Record<string, typeof FileText> = {
  upload_lease: FileText,
  upload_insurance: ShieldCheck,
  register_buzzer: BellRing,
  key_fob_pickup: KeyRound,
  schedule_elevator: ArrowUpDown,
  pay_deposit: DollarSign,
};

const tabs = ['Overview', 'Tasks', 'Documents', 'Elevator', 'Deposit'] as const;
type Tab = typeof tabs[number];

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function formatBytes(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MoveDetail({ move, tasks, documents, elevatorSlots, deposits }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [actingDeposit, setActingDeposit] = useState<string | null>(null);

  const completedTasks = tasks.filter((t) => t.completed).length;

  const uploadTasks = tasks.filter((t) =>
    t.completed && t.response?.file_path &&
    (t.type === 'upload_lease' || t.type === 'upload_insurance')
  );

  async function updateStatus(newStatus: string) {
    setUpdatingStatus(true);
    const supabase = createClient();
    await supabase.from('moves').update({ status: newStatus }).eq('id', move.id);
    setUpdatingStatus(false);
    router.refresh();
  }

  async function openFile(filePath: string) {
    const supabase = createClient();
    const { data } = await supabase.storage.from('documents').createSignedUrl(filePath, 300);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  }

  async function handleDepositAction(depositId: string, action: 'capture' | 'release') {
    setActingDeposit(depositId);
    try {
      const res = await fetch(`/api/stripe/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deposit_id: depositId }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        alert(error || 'Action failed');
      }
      router.refresh();
    } catch {
      alert('Network error');
    }
    setActingDeposit(null);
  }

  const currentStatusIdx = statusFlow.indexOf(move.status as any);
  const nextStatus = currentStatusIdx < statusFlow.length - 1 ? statusFlow[currentStatusIdx + 1] : null;
  const allTasksDone = tasks.length > 0 && completedTasks === tasks.length;

  const statusButtonLabel: Record<string, string> = {
    confirmed: 'Approve',
    in_progress: 'Mark in progress',
    completed: 'Mark completed',
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/moves"
          className="flex items-center justify-center h-9 w-9 rounded-lg border border-black/5 bg-white/60 hover:bg-white/80 transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{move.residentName}</h1>
            <Badge variant="secondary" className={statusColors[move.status] ?? ''}>
              {move.status.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {move.buildingName} · Unit {move.unitNumber} · {move.type.replace('_', ' ')} ·{' '}
            {new Date(move.scheduledDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        {nextStatus && (
          <div className="flex items-center gap-3 shrink-0">
            {move.status === 'pending' && tasks.length > 0 && !allTasksDone && (
              <span className="text-xs text-muted-foreground">
                {completedTasks}/{tasks.length} tasks done
              </span>
            )}
            <Button
              onClick={() => updateStatus(nextStatus)}
              disabled={updatingStatus}
              className="gap-1.5"
            >
              {nextStatus === 'confirmed' && <Check size={14} />}
              {statusButtonLabel[nextStatus] ?? nextStatus.replace('_', ' ')}
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted/60 p-1 mb-6">
        {tabs.map((tab) => {
          let badge = '';
          if (tab === 'Tasks' && tasks.length > 0) badge = `${completedTasks}/${tasks.length}`;
          if (tab === 'Documents' && (documents.length + uploadTasks.length) > 0) badge = `${documents.length + uploadTasks.length}`;
          if (tab === 'Deposit' && deposits.length > 0) badge = `${deposits.length}`;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-white shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
              {badge && (
                <span className="text-[10px] bg-black/5 rounded-full px-1.5 py-0.5">{badge}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'Overview' && (
        <div className="space-y-4">
          {move.status === 'pending' && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 backdrop-blur-sm p-5 flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-900">Pending approval</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  {tasks.length === 0
                    ? 'No checklist assigned yet.'
                    : allTasksDone
                      ? `All ${tasks.length} checklist tasks completed.`
                      : `${completedTasks} of ${tasks.length} checklist tasks completed.`}
                  {' '}You can approve at any time.
                </p>
              </div>
              <Button
                onClick={() => updateStatus('confirmed')}
                disabled={updatingStatus}
                className="gap-1.5 shrink-0"
              >
                <Check size={14} />
                Approve
              </Button>
            </div>
          )}

          <div className="rounded-xl border border-black/5 bg-white/60 backdrop-blur-sm p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Resident</p>
                <p className="font-medium">{move.residentName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Type</p>
                <p className="font-medium capitalize">{move.type.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Building / Unit</p>
                <p className="font-medium">{move.buildingName} · Unit {move.unitNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Scheduled Date</p>
                <p className="font-medium">
                  {new Date(move.scheduledDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              {move.timeSlot && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Time Slot</p>
                  <p className="font-medium">{move.timeSlot}</p>
                </div>
              )}
              {move.notes && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{move.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <button onClick={() => setActiveTab('Tasks')} className="rounded-xl border border-black/5 bg-white/60 backdrop-blur-sm p-5 text-left hover:bg-white/80 transition-colors">
              <p className="text-xs text-muted-foreground mb-2">Checklist</p>
              <p className="text-lg font-semibold">{completedTasks} / {tasks.length}</p>
              <p className="text-xs text-muted-foreground mt-1">tasks complete</p>
            </button>
            <button onClick={() => setActiveTab('Elevator')} className="rounded-xl border border-black/5 bg-white/60 backdrop-blur-sm p-5 text-left hover:bg-white/80 transition-colors">
              <p className="text-xs text-muted-foreground mb-2">Elevator</p>
              <p className="text-lg font-semibold">{elevatorSlots.length > 0 ? 'Booked' : 'None'}</p>
              <p className="text-xs text-muted-foreground mt-1">{elevatorSlots.length} slot{elevatorSlots.length !== 1 ? 's' : ''}</p>
            </button>
            <button onClick={() => setActiveTab('Deposit')} className="rounded-xl border border-black/5 bg-white/60 backdrop-blur-sm p-5 text-left hover:bg-white/80 transition-colors">
              <p className="text-xs text-muted-foreground mb-2">Deposit</p>
              <p className="text-lg font-semibold">
                {deposits.length > 0
                  ? `$${(deposits[0].amountCents / 100).toFixed(2)}`
                  : 'None'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{deposits[0]?.status ?? 'no hold'}</p>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'Tasks' && (
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-black/10 bg-white/40 p-12 text-center">
              <p className="text-sm text-muted-foreground">No checklist assigned yet. Send one from the Moves page.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-2 rounded-full bg-black/5 overflow-hidden">
                  <div
                    className="h-full bg-[#30261E] rounded-full transition-all"
                    style={{ width: `${tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground shrink-0">{completedTasks} of {tasks.length}</span>
              </div>
              {tasks.map((task) => {
                const Icon = (task.type && TASK_ICONS[task.type]) || FileText;
                return (
                  <div
                    key={task.id}
                    className={`rounded-xl border border-black/5 bg-white/60 backdrop-blur-sm p-5 ${task.completed ? 'opacity-70' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${task.completed ? 'bg-[#30261E]' : 'bg-[#E8F5DC]'}`}>
                        {task.completed
                          ? <Check size={14} className="text-white" strokeWidth={2.5} />
                          : <Icon size={14} className="text-[#30261E]" strokeWidth={1.8} />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </p>
                        {task.description && !task.completed && (
                          <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                        )}
                        {task.completed && task.response && (
                          <TaskResponse type={task.type} response={task.response} onOpenFile={openFile} />
                        )}
                      </div>
                      {task.completedAt && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {new Date(task.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                    {task.completed && task.type === 'register_buzzer' && task.response && (
                      <BuzzerEdit taskId={task.id} response={task.response} />
                    )}
                    {task.completed && task.type === 'key_fob_pickup' && task.response && (
                      <KeyFobAssignment taskId={task.id} response={task.response} />
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {activeTab === 'Documents' && (
        <div className="space-y-3">
          {uploadTasks.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3">Resident Uploads</h3>
              {uploadTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => openFile(task.response!.file_path)}
                  className="w-full flex items-center gap-3 rounded-xl border border-black/5 bg-white/60 backdrop-blur-sm p-4 hover:bg-white/80 transition-colors mb-2"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E8F5DC]">
                    <Upload size={15} className="text-[#30261E]" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium truncate">{task.response?.file_name ?? task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.title}</p>
                  </div>
                  <ExternalLink size={14} className="text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          )}

          <h3 className="text-sm font-semibold mb-3">Shared Documents</h3>
          {documents.length === 0 && uploadTasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-black/10 bg-white/40 p-12 text-center">
              <p className="text-sm text-muted-foreground">No documents for this move yet.</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-black/10 bg-white/40 p-8 text-center">
              <p className="text-sm text-muted-foreground">No shared documents.</p>
            </div>
          ) : (
            documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => openFile(doc.filePath)}
                className="w-full flex items-center gap-3 rounded-xl border border-black/5 bg-white/60 backdrop-blur-sm p-4 hover:bg-white/80 transition-colors"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black/[0.03]">
                  <FileText size={15} className="text-[#30261E]" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium truncate">{doc.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {doc.fileSize ? ` · ${formatBytes(doc.fileSize)}` : ''}
                  </p>
                </div>
                <ExternalLink size={14} className="text-muted-foreground shrink-0" />
              </button>
            ))
          )}
        </div>
      )}

      {activeTab === 'Elevator' && (
        <div>
          {elevatorSlots.length === 0 ? (
            <div className="rounded-xl border border-dashed border-black/10 bg-white/40 p-12 text-center">
              <ArrowUpDown size={24} className="mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No elevator booking yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {elevatorSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="rounded-xl border border-black/5 bg-white/60 backdrop-blur-sm p-5 flex items-center gap-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E8F5DC]">
                    <Clock size={17} className="text-[#30261E]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {new Date(slot.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatTime(slot.startTime)} — {formatTime(slot.endTime)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'Deposit' && (
        <div>
          {deposits.length === 0 ? (
            <div className="rounded-xl border border-dashed border-black/10 bg-white/40 p-12 text-center">
              <DollarSign size={24} className="mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No deposit hold for this move.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deposits.map((d) => {
                const statusStyle: Record<string, string> = {
                  authorized: 'bg-blue-100 text-blue-800',
                  captured: 'bg-green-100 text-green-800',
                  released: 'bg-gray-100 text-gray-600',
                  expired: 'bg-red-100 text-red-700',
                };
                return (
                  <div
                    key={d.id}
                    className="rounded-xl border border-black/5 bg-white/60 backdrop-blur-sm p-5 flex items-center gap-5"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#E8F5DC]">
                      <DollarSign size={19} className="text-[#30261E]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-semibold tabular-nums">${(d.amountCents / 100).toFixed(2)}</p>
                        <Badge variant="secondary" className={statusStyle[d.status] ?? ''}>
                          {d.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(d.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    {d.status === 'authorized' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDepositAction(d.id, 'capture')}
                          disabled={actingDeposit === d.id}
                          className="gap-1.5 text-xs"
                        >
                          <ArrowDownToLine size={13} />
                          Capture
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDepositAction(d.id, 'release')}
                          disabled={actingDeposit === d.id}
                          className="gap-1.5 text-xs text-muted-foreground"
                        >
                          <Undo2 size={13} />
                          Release
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BuzzerEdit({ taskId, response }: { taskId: string; response: Record<string, any> }) {
  const router = useRouter();
  const [assignedCode, setAssignedCode] = useState(response.assigned_buzzer_code ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const hasChanges = assignedCode !== (response.assigned_buzzer_code ?? '');

  async function save() {
    setSaving(true);
    const supabase = createClient();
    await supabase.from('move_tasks').update({
      response: { ...response, assigned_buzzer_code: assignedCode || null },
    }).eq('id', taskId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }

  return (
    <div className="border-t border-black/5 mt-3 pt-3">
      <p className="text-xs font-medium text-foreground/60 mb-2">Assign buzzer code</p>
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <label className="text-[10px] text-muted-foreground">Buzzer / intercom code</label>
          <Input
            placeholder="e.g. 1420"
            value={assignedCode}
            onChange={(e) => setAssignedCode(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        <Button
          size="sm"
          onClick={save}
          disabled={saving || !hasChanges}
          className="h-8 text-xs gap-1 px-3"
        >
          {saved ? <><Check size={12} /> Saved</> : saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
}

function KeyFobAssignment({ taskId, response }: { taskId: string; response: Record<string, any> }) {
  const router = useRouter();
  const [keyNums, setKeyNums] = useState(response.assigned_key_numbers ?? '');
  const [fobNums, setFobNums] = useState(response.assigned_fob_numbers ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const hasChanges = keyNums !== (response.assigned_key_numbers ?? '') || fobNums !== (response.assigned_fob_numbers ?? '');

  async function save() {
    setSaving(true);
    const supabase = createClient();
    await supabase.from('move_tasks').update({
      response: { ...response, assigned_key_numbers: keyNums || null, assigned_fob_numbers: fobNums || null },
    }).eq('id', taskId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }

  return (
    <div className="border-t border-black/5 mt-3 pt-3">
      <p className="text-xs font-medium text-foreground/60 mb-2">Assign key & fob numbers</p>
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <label className="text-[10px] text-muted-foreground">Key numbers</label>
          <Input
            placeholder="e.g. K-201, K-202"
            value={keyNums}
            onChange={(e) => setKeyNums(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        <div className="flex-1 space-y-1">
          <label className="text-[10px] text-muted-foreground">Fob numbers</label>
          <Input
            placeholder="e.g. F-1042"
            value={fobNums}
            onChange={(e) => setFobNums(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        <Button
          size="sm"
          onClick={save}
          disabled={saving || !hasChanges}
          className="h-8 text-xs gap-1 px-3"
        >
          {saved ? <><Check size={12} /> Saved</> : saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
}

function TaskResponse({ type, response, onOpenFile }: { type: string | null; response: Record<string, any>; onOpenFile: (path: string) => void }) {
  if ((type === 'upload_lease' || type === 'upload_insurance') && response.file_path) {
    return (
      <button
        onClick={() => onOpenFile(response.file_path)}
        className="inline-flex items-center gap-1.5 mt-1.5 text-xs text-foreground/70 hover:text-foreground transition-colors"
      >
        <FileText size={11} />
        {response.file_name ?? 'View file'}
        <ExternalLink size={10} />
      </button>
    );
  }
  if (type === 'register_buzzer' && response.buzzer_code) {
    return (
      <div className="mt-1 space-y-0.5">
        <p className="text-xs text-muted-foreground">
          Name: {response.buzzer_code}{response.phone ? ` · ${response.phone}` : ''}
        </p>
        {response.assigned_buzzer_code && (
          <p className="text-xs font-medium text-foreground/70">
            Buzzer code: {response.assigned_buzzer_code}
          </p>
        )}
      </div>
    );
  }
  if (type === 'key_fob_pickup' && response.num_keys !== undefined) {
    return (
      <div className="mt-1 space-y-1">
        <p className="text-xs text-muted-foreground">
          {response.num_keys} key{response.num_keys !== 1 ? 's' : ''}, {response.num_fobs} fob{response.num_fobs !== 1 ? 's' : ''}
          {response.pickup_person ? ` · ${response.pickup_person}` : ''}
        </p>
        {(response.assigned_key_numbers || response.assigned_fob_numbers) && (
          <p className="text-xs font-medium text-foreground/70">
            {response.assigned_key_numbers ? `Key #: ${response.assigned_key_numbers}` : ''}
            {response.assigned_key_numbers && response.assigned_fob_numbers ? ' · ' : ''}
            {response.assigned_fob_numbers ? `Fob #: ${response.assigned_fob_numbers}` : ''}
          </p>
        )}
      </div>
    );
  }
  if (type === 'schedule_elevator' && response.date) {
    return (
      <p className="text-xs text-muted-foreground mt-1">
        {new Date(response.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        {' '}· {formatTime(response.start_time)} — {formatTime(response.end_time)}
      </p>
    );
  }
  if (type === 'pay_deposit' && response.payment_intent_id) {
    return (
      <p className="text-xs text-muted-foreground mt-1">Hold authorized</p>
    );
  }
  if (response.confirmed) {
    return (
      <p className="text-xs text-muted-foreground mt-1">
        {response.note ? `Done — ${response.note}` : 'Done'}
      </p>
    );
  }
  return null;
}

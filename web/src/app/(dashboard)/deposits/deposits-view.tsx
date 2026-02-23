'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, ArrowDownToLine, Undo2 } from 'lucide-react';

interface Deposit {
  id: string;
  amountCents: number;
  status: string;
  createdAt: string;
  residentName: string;
  unitNumber: string;
  buildingName: string;
  scheduledDate?: string;
}

const statusStyles: Record<string, string> = {
  authorized: 'bg-blue-100 text-blue-800',
  captured: 'bg-green-100 text-green-800',
  released: 'bg-gray-100 text-gray-600',
  expired: 'bg-red-100 text-red-700',
};

export function DepositsView({ deposits }: { deposits: Deposit[] }) {
  const router = useRouter();
  const [acting, setActing] = useState<string | null>(null);

  async function handleAction(depositId: string, action: 'capture' | 'release') {
    setActing(depositId);
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
    setActing(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Deposits</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {deposits.length} deposit hold{deposits.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {deposits.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/10 bg-white/40 p-12 text-center">
          <DollarSign size={28} className="mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No deposits yet. They appear when residents authorize a card hold.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {deposits.map((d) => (
            <div
              key={d.id}
              className="rounded-xl border border-black/5 bg-white/60 backdrop-blur-sm p-5 flex items-center gap-5"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#E8F5DC]">
                <DollarSign size={19} className="text-[#30261E]" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{d.residentName}</p>
                  <Badge variant="secondary" className={statusStyles[d.status] ?? ''}>
                    {d.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {d.buildingName} — Unit {d.unitNumber}
                  {d.scheduledDate && ` • ${new Date(d.scheduledDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                </p>
              </div>

              <p className="text-lg font-semibold tabular-nums shrink-0">
                ${(d.amountCents / 100).toFixed(2)}
              </p>

              {d.status === 'authorized' && (
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction(d.id, 'capture')}
                    disabled={acting === d.id}
                    className="gap-1.5 text-xs"
                  >
                    <ArrowDownToLine size={13} />
                    Capture
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAction(d.id, 'release')}
                    disabled={acting === d.id}
                    className="gap-1.5 text-xs text-muted-foreground"
                  >
                    <Undo2 size={13} />
                    Release
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

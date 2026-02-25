'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Check, X, ChevronDown } from 'lucide-react';

interface Booking {
  id: string;
  scheduledDate: string;
  timeSlot: string | null;
  status: string;
  notes: string | null;
  residentName: string;
  residentUnit: string | null;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-gray-50 text-gray-500 border-gray-200',
};

interface Props {
  moverId: string;
  bookings: Booking[];
}

export function BookingsView({ moverId, bookings }: Props) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function updateStatus(bookingId: string, status: string) {
    const supabase = createClient();
    await supabase.from('mover_bookings').update({ status }).eq('id', bookingId);
    router.refresh();
  }

  const pending = bookings.filter((b) => b.status === 'pending');
  const rest = bookings.filter((b) => b.status !== 'pending');
  const sorted = [...pending, ...rest];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {bookings.length} booking{bookings.length !== 1 ? 's' : ''} · {pending.length} pending
        </p>
      </div>

      <div className="rounded-xl border border-black/5 bg-white/60 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Resident</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[140px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  No bookings yet. They&apos;ll appear here when residents book your services.
                </TableCell>
              </TableRow>
            )}
            {sorted.map((b) => {
              const isOpen = expandedId === b.id;
              return (
                <>
                  <TableRow
                    key={b.id}
                    className="cursor-pointer hover:bg-black/[0.02] transition-colors"
                    onClick={() => setExpandedId(isOpen ? null : b.id)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <ChevronDown
                          size={14}
                          className={`text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        />
                        {b.residentName}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(b.scheduledDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-sm">{b.timeSlot ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusColors[b.status] ?? ''}>
                        {b.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                        {b.status === 'pending' && (
                          <>
                            <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => updateStatus(b.id, 'confirmed')}>
                              <Check size={12} /> Confirm
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground hover:text-destructive" onClick={() => updateStatus(b.id, 'cancelled')}>
                              <X size={12} />
                            </Button>
                          </>
                        )}
                        {b.status === 'confirmed' && (
                          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => updateStatus(b.id, 'completed')}>
                            <Check size={12} /> Complete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  {isOpen && (
                    <TableRow key={`${b.id}-detail`} className="bg-muted/30 hover:bg-muted/30">
                      <TableCell colSpan={5}>
                        <div className="grid grid-cols-2 gap-x-12 gap-y-3 py-2 pl-8 text-sm">
                          {b.residentUnit && (
                            <div>
                              <span className="text-muted-foreground">Unit: </span>
                              <span className="font-medium">{b.residentUnit}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-muted-foreground">Requested: </span>
                            <span className="font-medium">
                              {new Date(b.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Notes: </span>
                            <span className="font-medium">{b.notes || 'No notes provided'}</span>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

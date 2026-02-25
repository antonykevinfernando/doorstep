import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';
import { useMove } from './use-move';

export interface ActivityItem {
  id: string;
  type: 'elevator' | 'mover' | 'service_request';
  title: string;
  subtitle: string;
  status: string;
  createdAt: string;
  meta: Record<string, any>;
}

function fmtTime(time: string) {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function parseServiceType(body: string): string {
  const match = body.match(/📋 Service Request: (.+)/);
  if (!match) return 'Service Request';
  const raw = match[1].split('\n')[0].trim();
  if (raw.includes('Elevator')) return 'Elevator Booking';
  if (raw.includes('Key') || raw.includes('Fob')) return 'Key / Fob Request';
  if (raw.includes('Buzzer')) return 'Buzzer Update';
  return raw;
}

export function useActivity() {
  const { user } = useAuth();
  const { move } = useMove();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user || !move) { setLoading(false); return; }
    setLoading(true);

    const [elevatorRes, moverRes, messagesRes] = await Promise.all([
      supabase
        .from('elevator_slots')
        .select('id, date, start_time, end_time, created_at')
        .eq('move_id', move.id),
      supabase
        .from('mover_bookings')
        .select(`
          id, scheduled_date, time_slot, status, notes, created_at,
          mover:movers!mover_bookings_mover_id_fkey(company_name, phone)
        `)
        .eq('resident_id', user.id),
      supabase
        .from('messages')
        .select('id, body, created_at')
        .eq('move_id', move.id)
        .eq('sender_id', user.id)
        .like('body', '📋 Service Request:%'),
    ]);

    const result: ActivityItem[] = [];
    const today = new Date().toISOString().split('T')[0];

    for (const e of elevatorRes.data ?? []) {
      const isPast = e.date < today;
      result.push({
        id: `elevator-${e.id}`,
        type: 'elevator',
        title: 'Elevator Booking',
        subtitle: `${fmtDate(e.date)} · ${fmtTime(e.start_time)} — ${fmtTime(e.end_time)}`,
        status: isPast ? 'completed' : 'booked',
        createdAt: e.created_at,
        meta: { date: e.date, start_time: e.start_time, end_time: e.end_time },
      });
    }

    for (const b of moverRes.data ?? []) {
      const mover = b.mover as any;
      result.push({
        id: `mover-${b.id}`,
        type: 'mover',
        title: mover?.company_name ?? 'Mover Booking',
        subtitle: `${fmtDate(b.scheduled_date)}${b.time_slot ? ` · ${b.time_slot}` : ''}`,
        status: b.status,
        createdAt: b.created_at,
        meta: {
          scheduledDate: b.scheduled_date,
          timeSlot: b.time_slot,
          notes: b.notes,
          moverName: mover?.company_name ?? 'Unknown',
          moverPhone: mover?.phone ?? null,
          bookingId: b.id,
        },
      });
    }

    for (const m of messagesRes.data ?? []) {
      const svcType = parseServiceType(m.body);
      const lines = m.body.split('\n').slice(1).filter(Boolean);
      result.push({
        id: `svc-${m.id}`,
        type: 'service_request',
        title: svcType,
        subtitle: lines[0] || 'Sent to management',
        status: 'sent',
        createdAt: m.created_at,
        meta: { body: m.body, messageId: m.id },
      });
    }

    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setItems(result);
    setLoading(false);
  }, [user, move]);

  useEffect(() => { fetch(); }, [fetch]);

  return { items, loading, refetch: fetch };
}

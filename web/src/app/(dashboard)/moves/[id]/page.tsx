import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MoveDetail } from './move-detail';

export default async function MoveDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: move } = await supabase
    .from('moves')
    .select(`
      *,
      resident:profiles!moves_resident_id_fkey(id, full_name),
      unit:units!moves_unit_id_fkey(
        number, floor,
        building:buildings!units_building_id_fkey(id, name)
      )
    `)
    .eq('id', params.id)
    .single();

  if (!move) notFound();

  const { data: tasks } = await supabase
    .from('move_tasks')
    .select('id, title, type, description, config, completed, completed_at, response, sort_order')
    .eq('move_id', params.id)
    .order('sort_order', { ascending: true });

  const { data: documents } = await supabase
    .from('documents')
    .select('id, title, file_path, file_size, created_at')
    .eq('move_id', params.id)
    .order('created_at', { ascending: false });

  const { data: elevatorSlots } = await supabase
    .from('elevator_slots')
    .select('id, date, start_time, end_time')
    .eq('move_id', params.id)
    .order('date', { ascending: true });

    const { data: deposits } = await supabase
      .from('deposits')
      .select('id, amount_cents, status, created_at, stripe_payment_intent_id, notes')
      .eq('move_id', params.id)
      .order('created_at', { ascending: false });

  return (
    <MoveDetail
      move={{
        id: move.id,
        type: move.type,
        status: move.status,
        scheduledDate: move.scheduled_date,
        timeSlot: move.time_slot,
        notes: move.notes,
        createdAt: move.created_at,
        residentName: move.resident?.full_name ?? 'Unknown',
        residentId: move.resident?.id ?? '',
        unitNumber: move.unit?.number ?? '',
        buildingName: move.unit?.building?.name ?? '',
        buildingId: move.unit?.building?.id ?? '',
      }}
      tasks={(tasks ?? []).map((t: any) => ({
        id: t.id,
        title: t.title,
        type: t.type,
        description: t.description,
        completed: t.completed,
        completedAt: t.completed_at,
        response: t.response,
      }))}
      documents={(documents ?? []).map((d: any) => ({
        id: d.id,
        title: d.title,
        filePath: d.file_path,
        fileSize: d.file_size,
        createdAt: d.created_at,
      }))}
      elevatorSlots={(elevatorSlots ?? []).map((s: any) => ({
        id: s.id,
        date: s.date,
        startTime: s.start_time,
        endTime: s.end_time,
      }))}
      deposits={(deposits ?? []).map((d: any) => ({
        id: d.id,
        amountCents: d.amount_cents,
        status: d.status,
        createdAt: d.created_at,
        notes: d.notes,
      }))}
    />
  );
}

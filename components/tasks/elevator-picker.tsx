import { useEffect, useState } from 'react';
import { View, Pressable, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { ArrowUpDown, Check, Calendar } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useMove } from '@/hooks/use-move';

interface GeneratedSlot {
  key: string;
  date: string;
  start_time: string;
  end_time: string;
}

interface Props {
  taskId: string;
  response: Record<string, any> | null;
  onSubmit: (taskId: string, response: Record<string, any>) => void;
}

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

const LOOKAHEAD_DAYS = 60;

export function ElevatorPicker({ taskId, response, onSubmit }: Props) {
  const { move } = useMove();
  const [slots, setSlots] = useState<GeneratedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState(false);

  useEffect(() => {
    if (!move) return;
    generateSlots();
  }, [move]);

  async function generateSlots() {
    setLoading(true);

    const { data: moveRow } = await supabase
      .from('moves')
      .select('unit:units!moves_unit_id_fkey(building_id)')
      .eq('id', move!.id)
      .single();

    const buildingId = (moveRow as any)?.unit?.building_id;
    if (!buildingId) { setLoading(false); return; }

    const [{ data: schedules }, { data: existingBookings }] = await Promise.all([
      supabase
        .from('elevator_schedules')
        .select('day_of_week, start_time, end_time')
        .eq('building_id', buildingId),
      supabase
        .from('elevator_slots')
        .select('date, start_time, end_time')
        .eq('building_id', buildingId)
        .not('move_id', 'is', null)
        .gte('date', new Date().toISOString().split('T')[0]),
    ]);

    if (!schedules || schedules.length === 0) {
      setSlots([]);
      setLoading(false);
      return;
    }

    const bookedSet = new Set(
      (existingBookings ?? []).map((b: any) => `${b.date}|${b.start_time}|${b.end_time}`)
    );

    const generated: GeneratedSlot[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < LOOKAHEAD_DAYS; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dayOfWeek = d.getDay();
      const dateStr = d.toISOString().split('T')[0];

      for (const sched of schedules) {
        if ((sched as any).day_of_week !== dayOfWeek) continue;
        const key = `${dateStr}|${sched.start_time}|${sched.end_time}`;
        if (bookedSet.has(key)) continue;

        generated.push({
          key,
          date: dateStr,
          start_time: sched.start_time,
          end_time: sched.end_time,
        });
      }
    }

    setSlots(generated);
    setLoading(false);
  }

  async function bookSlot(slot: GeneratedSlot) {
    if (!move) return;
    setBooking(slot.key);

    const { data: moveRow } = await supabase
      .from('moves')
      .select('unit:units!moves_unit_id_fkey(building_id)')
      .eq('id', move.id)
      .single();

    const buildingId = (moveRow as any)?.unit?.building_id;

    const { error } = await supabase.from('elevator_slots').insert({
      building_id: buildingId,
      date: slot.date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      move_id: move.id,
    });

    if (error) {
      setBooking(null);
      return;
    }

    onSubmit(taskId, {
      date: slot.date,
      start_time: slot.start_time,
      end_time: slot.end_time,
    });
    setBooking(null);
    setRescheduling(false);
  }

  if (response?.date && response?.start_time && !rescheduling) {
    return (
      <View style={styles.completedWrap}>
        <View style={styles.completedRow}>
          <ArrowUpDown size={14} color={Colors.greenDark} strokeWidth={2} />
          <Text variant="caption" color={Colors.brown}>
            {formatDate(response.date)} • {formatTime(response.start_time)} — {formatTime(response.end_time)}
          </Text>
          <Check size={14} color={Colors.greenDark} strokeWidth={2.5} />
        </View>
        <Pressable
          style={({ pressed }) => [styles.changeBtn, pressed && { opacity: 0.7 }]}
          onPress={() => { setRescheduling(true); generateSlots(); }}
        >
          <Text variant="caption" medium color={Colors.brownMuted}>Reschedule</Text>
        </Pressable>
      </View>
    );
  }

  if (loading) {
    return <ActivityIndicator size="small" color={Colors.brown} style={{ alignSelf: 'flex-start' }} />;
  }

  if (slots.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text variant="caption" color={Colors.brownMuted}>
          No available elevator slots. Contact your property manager.
        </Text>
      </View>
    );
  }

  const grouped: Record<string, GeneratedSlot[]> = {};
  for (const slot of slots) {
    if (!grouped[slot.date]) grouped[slot.date] = [];
    grouped[slot.date].push(slot);
  }

  return (
    <View style={styles.wrap}>
      <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} style={styles.scroll}>
        {Object.entries(grouped).map(([date, dateSlots]) => (
          <View key={date} style={styles.dateGroup}>
            <View style={styles.dateHeader}>
              <Calendar size={12} color={Colors.brownMuted} strokeWidth={2} />
              <Text variant="caption" medium color={Colors.brownMuted}>{formatDate(date)}</Text>
            </View>
            <View style={styles.slotGrid}>
              {dateSlots.map((slot) => (
                <Pressable
                  key={slot.key}
                  style={({ pressed }) => [styles.slotCard, pressed && { opacity: 0.7 }]}
                  onPress={() => bookSlot(slot)}
                  disabled={booking !== null}
                >
                  {booking === slot.key ? (
                    <ActivityIndicator size="small" color={Colors.brown} />
                  ) : (
                    <Text variant="caption" medium color={Colors.brown}>
                      {formatTime(slot.start_time)} — {formatTime(slot.end_time)}
                    </Text>
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    maxHeight: 220,
  },
  scroll: {
    flexGrow: 0,
  },
  dateGroup: {
    marginBottom: Spacing.md,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  slotCard: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.sm,
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
  },
  completedWrap: {
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.greenLight,
    borderRadius: Radius.sm,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
  },
  changeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  emptyWrap: {
    paddingVertical: Spacing.sm,
  },
});

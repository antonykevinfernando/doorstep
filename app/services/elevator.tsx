import { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import {
  ArrowLeft,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
  CheckCircle2,
} from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Colors, Spacing, Radius, Grid } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useMove } from '@/hooks/use-move';
import { useAuth } from '@/context/auth';

interface Slot {
  key: string;
  date: string;
  start_time: string;
  end_time: string;
}

function fmtTime(time: string) {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function fmtDateLong(d: Date) {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

const LOOKAHEAD_DAYS = 60;
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function isBeforeDay(a: Date, b: Date) {
  return new Date(a.getFullYear(), a.getMonth(), a.getDate()) < new Date(b.getFullYear(), b.getMonth(), b.getDate());
}

function MiniCalendar({ selected, onSelect, minDate, availableDates }: {
  selected: Date;
  onSelect: (d: Date) => void;
  minDate: Date;
  availableDates: Set<string>;
}) {
  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());

  const cells = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const rows: (Date | null)[][] = [];
    let row: (Date | null)[] = [];
    for (let i = 0; i < startDay; i++) row.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      row.push(new Date(viewYear, viewMonth, d));
      if (row.length === 7) { rows.push(row); row = []; }
    }
    if (row.length > 0) {
      while (row.length < 7) row.push(null);
      rows.push(row);
    }
    return rows;
  }, [viewYear, viewMonth]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  }

  const canGoPrev = !(viewYear === minDate.getFullYear() && viewMonth === minDate.getMonth());

  return (
    <View style={cal.wrap}>
      <View style={cal.header}>
        <Pressable onPress={prevMonth} disabled={!canGoPrev} hitSlop={8} style={{ opacity: canGoPrev ? 1 : 0.25 }}>
          <ChevronLeft size={20} color={Colors.brown} strokeWidth={1.8} />
        </Pressable>
        <Text variant="body" semibold color={Colors.brown}>{MONTHS[viewMonth]} {viewYear}</Text>
        <Pressable onPress={nextMonth} hitSlop={8}>
          <ChevronRight size={20} color={Colors.brown} strokeWidth={1.8} />
        </Pressable>
      </View>
      <View style={cal.dayLabels}>
        {DAYS.map((d) => (
          <View key={d} style={cal.cell}>
            <Text variant="label" color={Colors.brownMuted}>{d}</Text>
          </View>
        ))}
      </View>
      {cells.map((row, ri) => (
        <View key={ri} style={cal.row}>
          {row.map((day, ci) => {
            if (!day) return <View key={ci} style={cal.cell} />;
            const dateStr = day.toISOString().split('T')[0];
            const hasSlots = availableDates.has(dateStr);
            const isSelected = isSameDay(day, selected);
            const isPast = isBeforeDay(day, minDate);
            const isToday = isSameDay(day, new Date());
            const disabled = isPast || !hasSlots;
            return (
              <View key={ci} style={cal.cell}>
                <Pressable
                  onPress={() => !disabled && onSelect(day)}
                  disabled={disabled}
                  style={[
                    cal.dayBtn,
                    isSelected && cal.daySelected,
                    isToday && !isSelected && cal.dayToday,
                  ]}
                >
                  <Text
                    variant="body"
                    medium={isSelected || isToday}
                    color={disabled ? Colors.brownMuted : isSelected ? Colors.cream : Colors.brown}
                    style={disabled ? { opacity: 0.25 } : undefined}
                  >
                    {day.getDate()}
                  </Text>
                </Pressable>
                {hasSlots && !isPast && !isSelected && (
                  <View style={cal.dot} />
                )}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export default function ElevatorServiceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { move } = useMove();
  const [allSlots, setAllSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selected, setSelected] = useState<Slot | null>(null);
  const [booking, setBooking] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookedSlot, setBookedSlot] = useState<Slot | null>(null);

  useEffect(() => {
    if (move) loadSlots();
  }, [move]);

  async function loadSlots() {
    setLoading(true);
    const { data: moveRow } = await supabase
      .from('moves')
      .select('unit:units!moves_unit_id_fkey(building_id)')
      .eq('id', move!.id)
      .single();

    const buildingId = (moveRow as any)?.unit?.building_id;
    if (!buildingId) { setLoading(false); return; }

    const [{ data: schedules }, { data: existing }] = await Promise.all([
      supabase.from('elevator_schedules').select('day_of_week, start_time, end_time').eq('building_id', buildingId),
      supabase.from('elevator_slots').select('date, start_time, end_time').eq('building_id', buildingId).not('move_id', 'is', null).gte('date', new Date().toISOString().split('T')[0]),
    ]);

    if (!schedules?.length) { setAllSlots([]); setLoading(false); return; }

    const bookedSet = new Set((existing ?? []).map((b: any) => `${b.date}|${b.start_time}|${b.end_time}`));
    const generated: Slot[] = [];
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
        generated.push({ key, date: dateStr, start_time: sched.start_time, end_time: sched.end_time });
      }
    }

    setAllSlots(generated);
    if (generated.length > 0) {
      setSelectedDate(new Date(generated[0].date + 'T00:00:00'));
    }
    setLoading(false);
  }

  const availableDates = useMemo(() => new Set(allSlots.map((s) => s.date)), [allSlots]);
  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  const slotsForDate = allSlots.filter((s) => s.date === selectedDateStr);

  async function confirmBooking() {
    if (!move || !user || !selected) return;
    setBooking(true);

    const { data: moveRow } = await supabase
      .from('moves')
      .select('unit:units!moves_unit_id_fkey(building_id)')
      .eq('id', move.id)
      .single();
    const buildingId = (moveRow as any)?.unit?.building_id;

    const { error } = await supabase.from('elevator_slots').insert({
      building_id: buildingId,
      date: selected.date,
      start_time: selected.start_time,
      end_time: selected.end_time,
      move_id: move.id,
    });

    if (error) {
      Alert.alert('Unavailable', 'This slot was just taken. Please pick another.');
      setBooking(false);
      setSelected(null);
      loadSlots();
      return;
    }

    await supabase.from('messages').insert({
      move_id: move.id,
      sender_id: user.id,
      body: `📋 Service Request: Elevator Booking\n${fmtDateLong(selectedDate)} · ${fmtTime(selected.start_time)} — ${fmtTime(selected.end_time)}`,
    });

    setBookedSlot(selected);
    setSuccess(true);
    setBooking(false);
  }

  if (success && bookedSlot) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.successWrap}>
          <View style={styles.successIcon}>
            <CheckCircle2 size={48} color={Colors.brown} strokeWidth={1.5} />
          </View>
          <Text variant="title" color={Colors.brown} center>Elevator Booked</Text>
          <View style={styles.successCard}>
            <View style={styles.successRow}>
              <Calendar size={15} color={Colors.brownMuted} strokeWidth={1.8} />
              <Text variant="body" medium color={Colors.brown}>{fmtDateLong(new Date(bookedSlot.date + 'T00:00:00'))}</Text>
            </View>
            <View style={styles.successRow}>
              <Clock size={15} color={Colors.brownMuted} strokeWidth={1.8} />
              <Text variant="body" medium color={Colors.brown}>{fmtTime(bookedSlot.start_time)} — {fmtTime(bookedSlot.end_time)}</Text>
            </View>
          </View>
          <Text variant="caption" color={Colors.brownMuted} center style={{ marginTop: Spacing.sm }}>
            Your property manager has been notified.
          </Text>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.doneBtn, pressed && { opacity: 0.85 }]}>
            <Text variant="body" semibold color={Colors.cream}>Done</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + Spacing.sm }]}>
      <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
        <BlurView intensity={40} tint="light" style={styles.backBlur}>
          <ArrowLeft size={20} color={Colors.brown} strokeWidth={1.8} />
        </BlurView>
      </Pressable>

      <Text variant="title" color={Colors.brown} center>Book Elevator</Text>
      <Text variant="caption" color={Colors.brownMuted} center style={{ marginTop: 2, marginBottom: Spacing.lg }}>
        Pick a date, then choose a time
      </Text>

      {loading ? (
        <ActivityIndicator color={Colors.brown} style={{ marginTop: Spacing.xl }} />
      ) : allSlots.length === 0 ? (
        <View style={styles.emptyWrap}>
          <ArrowUpDown size={32} color={Colors.brownMuted} strokeWidth={1.5} />
          <Text variant="body" color={Colors.brownMuted} center style={{ marginTop: Spacing.md }}>
            No available slots right now.{'\n'}Contact your property manager.
          </Text>
        </View>
      ) : (
        <>
          <MiniCalendar
            selected={selectedDate}
            onSelect={(d) => { setSelectedDate(d); setSelected(null); }}
            minDate={new Date()}
            availableDates={availableDates}
          />

          <View style={styles.timeSectionHeader}>
            <Clock size={13} color={Colors.brownMuted} strokeWidth={2} />
            <Text variant="label" color={Colors.brownMuted}>
              {slotsForDate.length > 0
                ? `${slotsForDate.length} SLOT${slotsForDate.length !== 1 ? 'S' : ''} AVAILABLE`
                : 'NO SLOTS ON THIS DATE'}
            </Text>
          </View>

          <View style={styles.timeGrid}>
            {slotsForDate.map((slot) => {
              const isActive = selected?.key === slot.key;
              return (
                <Pressable
                  key={slot.key}
                  onPress={() => setSelected(isActive ? null : slot)}
                  style={[styles.timeChip, isActive && styles.timeChipActive]}
                >
                  <Text variant="body" medium color={isActive ? Colors.cream : Colors.brown}>
                    {fmtTime(slot.start_time)}
                  </Text>
                  <Text variant="caption" color={isActive ? 'rgba(255,255,255,0.6)' : Colors.brownMuted}>
                    {fmtTime(slot.end_time)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      {selected && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.md }]}>
          <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
          <Pressable
            onPress={confirmBooking}
            disabled={booking}
            style={({ pressed }) => [styles.confirmBtn, pressed && { opacity: 0.85 }, booking && { opacity: 0.5 }]}
          >
            {booking ? (
              <ActivityIndicator color={Colors.cream} size="small" />
            ) : (
              <Text variant="body" semibold color={Colors.cream}>
                Confirm · {fmtTime(selected.start_time)} — {fmtTime(selected.end_time)}
              </Text>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

const cal = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.glass,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  dayLabels: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3,
  },
  dayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelected: {
    backgroundColor: Colors.brown,
  },
  dayToday: {
    backgroundColor: Colors.overlay,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.greenDark,
    marginTop: 1,
  },
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.cream,
    paddingHorizontal: Grid.margin,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
  },
  backBlur: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  timeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  timeChip: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.md,
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    minWidth: 100,
  },
  timeChipActive: {
    backgroundColor: Colors.brown,
    borderColor: Colors.brown,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: Colors.glassBorder,
    overflow: 'hidden',
  },
  confirmBtn: {
    backgroundColor: Colors.brown,
    borderRadius: Radius.md,
    paddingVertical: 16,
    marginHorizontal: Grid.margin,
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  successWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  successIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  successCard: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    width: '100%',
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  doneBtn: {
    backgroundColor: Colors.brown,
    borderRadius: Radius.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xxl,
    marginTop: Spacing.xl,
  },
});

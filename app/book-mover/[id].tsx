import { useState, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import {
  ArrowLeft,
  Truck,
  Calendar,
  Clock,
  CheckCircle2,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Colors, Spacing, Radius, FontSize, FontFamily, Grid } from '@/constants/theme';
import { useMover } from '@/hooks/use-movers';
import { useMove } from '@/hooks/use-move';
import { useAuth } from '@/context/auth';
import { supabase } from '@/lib/supabase';

const TIME_SLOTS = [
  '8:00 AM – 10:00 AM',
  '10:00 AM – 12:00 PM',
  '12:00 PM – 2:00 PM',
  '2:00 PM – 4:00 PM',
  '4:00 PM – 6:00 PM',
];

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isBeforeDay(a: Date, b: Date) {
  const ac = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const bc = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return ac < bc;
}

function CustomCalendar({ selected, onSelect, minDate }: { selected: Date; onSelect: (d: Date) => void; minDate: Date }) {
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
    <View style={calStyles.wrap}>
      <View style={calStyles.header}>
        <Pressable onPress={prevMonth} disabled={!canGoPrev} hitSlop={8} style={{ opacity: canGoPrev ? 1 : 0.25 }}>
          <ChevronLeft size={20} color={Colors.brown} strokeWidth={1.8} />
        </Pressable>
        <Text variant="body" semibold color={Colors.brown}>{MONTHS[viewMonth]} {viewYear}</Text>
        <Pressable onPress={nextMonth} hitSlop={8}>
          <ChevronRight size={20} color={Colors.brown} strokeWidth={1.8} />
        </Pressable>
      </View>

      <View style={calStyles.dayLabels}>
        {DAYS.map((d) => (
          <View key={d} style={calStyles.cell}>
            <Text variant="label" color={Colors.brownMuted}>{d}</Text>
          </View>
        ))}
      </View>

      {cells.map((row, ri) => (
        <View key={ri} style={calStyles.row}>
          {row.map((day, ci) => {
            if (!day) return <View key={ci} style={calStyles.cell} />;
            const isSelected = isSameDay(day, selected);
            const isPast = isBeforeDay(day, minDate);
            const isToday = isSameDay(day, new Date());
            return (
              <View key={ci} style={calStyles.cell}>
                <Pressable
                  onPress={() => !isPast && onSelect(day)}
                  disabled={isPast}
                  style={[
                    calStyles.dayBtn,
                    isSelected && calStyles.daySelected,
                    isToday && !isSelected && calStyles.dayToday,
                  ]}
                >
                  <Text
                    variant="body"
                    medium={isSelected || isToday}
                    color={isPast ? Colors.brownMuted : isSelected ? Colors.cream : Colors.brown}
                    style={isPast ? { opacity: 0.35 } : undefined}
                  >
                    {day.getDate()}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const calStyles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.glass,
    borderRadius: Radius.md,
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
    paddingVertical: 4,
  },
  dayBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelected: {
    backgroundColor: Colors.brown,
  },
  dayToday: {
    backgroundColor: Colors.overlay,
  },
});

export default function BookMoverScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { mover, loading } = useMover(id);
  const { move } = useMove();

  const initialDate = move?.scheduled_date ? new Date(move.scheduled_date + 'T00:00:00') : new Date();
  const [date, setDate] = useState(initialDate);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  function formatDate(d: Date) {
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }

  async function handleBook() {
    if (!user || !mover) return;
    if (!selectedSlot) {
      Alert.alert('Pick a time', 'Please select a time slot for your move.');
      return;
    }

    setSubmitting(true);
    const dateStr = date.toISOString().split('T')[0];
    const { error } = await supabase.from('mover_bookings').insert({
      mover_id: mover.id,
      resident_id: user.id,
      move_id: move?.id ?? null,
      scheduled_date: dateStr,
      time_slot: selectedSlot,
      notes: notes.trim() || null,
    });

    setSubmitting(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setSuccess(true);
    }
  }

  const scrollRef = useRef<ScrollView>(null);

  if (success) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={styles.successWrap}>
          <View style={styles.successIcon}>
            <CheckCircle2 size={48} color={Colors.brown} strokeWidth={1.5} />
          </View>
          <Text variant="title" color={Colors.brown} center>Booking Requested!</Text>
          <Text variant="body" color={Colors.brownMuted} center style={{ marginTop: Spacing.sm }}>
            {mover?.companyName} will review your request and confirm.{'\n'}You'll see the status in your profile.
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.doneBtn, pressed && styles.pressed]}
          >
            <Text variant="body" semibold color={Colors.cream}>Done</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.sm, paddingBottom: insets.bottom + Spacing.xxl }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <BlurView intensity={40} tint="light" style={styles.backBlur}>
            <ArrowLeft size={20} color={Colors.brown} strokeWidth={1.8} />
          </BlurView>
        </Pressable>

        {loading ? (
          <ActivityIndicator color={Colors.brown} style={{ marginTop: Spacing.xxl }} />
        ) : !mover ? (
          <View style={styles.empty}>
            <Text variant="body" color={Colors.brownMuted}>Mover not found</Text>
          </View>
        ) : (
          <>
            <Card style={styles.moverHeader}>
              <View style={styles.moverRow}>
                <View style={styles.avatar}>
                  <Truck size={20} color={Colors.cream} strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="subtitle" color={Colors.brown}>{mover.companyName}</Text>
                  {mover.serviceArea && (
                    <Text variant="caption" color={Colors.brownMuted}>{mover.serviceArea}</Text>
                  )}
                  {(mover.priceRangeMin != null || mover.priceRangeMax != null) && (
                    <Text variant="caption" color={Colors.brownMuted}>
                      {mover.priceRangeMin != null && mover.priceRangeMax != null
                        ? `$${mover.priceRangeMin} – $${mover.priceRangeMax} / hr`
                        : mover.priceRangeMin != null
                          ? `From $${mover.priceRangeMin} / hr`
                          : `Up to $${mover.priceRangeMax} / hr`}
                    </Text>
                  )}
                </View>
              </View>
            </Card>

            <Text variant="label" color={Colors.brownMuted} style={styles.sectionLabel}>DATE</Text>
            <Pressable onPress={() => setShowDatePicker(!showDatePicker)}>
              <Card style={styles.dateCard}>
                <View style={styles.dateRow}>
                  <Calendar size={16} color={Colors.brown} strokeWidth={1.8} />
                  <Text variant="body" medium color={Colors.brown}>{formatDate(date)}</Text>
                </View>
              </Card>
            </Pressable>
            {showDatePicker && (
              <CustomCalendar
                selected={date}
                onSelect={(d) => { setDate(d); setShowDatePicker(false); }}
                minDate={new Date()}
              />
            )}

            <Text variant="label" color={Colors.brownMuted} style={styles.sectionLabel}>TIME SLOT</Text>
            <View style={styles.slots}>
              {TIME_SLOTS.map((slot) => {
                const isActive = selectedSlot === slot;
                return (
                  <Pressable
                    key={slot}
                    onPress={() => setSelectedSlot(slot)}
                    style={[styles.slot, isActive && styles.slotActive]}
                  >
                    <Clock size={13} color={isActive ? Colors.cream : Colors.brownMuted} strokeWidth={1.8} />
                    <Text
                      variant="caption"
                      medium
                      color={isActive ? Colors.cream : Colors.brown}
                    >
                      {slot}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text variant="label" color={Colors.brownMuted} style={styles.sectionLabel}>NOTES (OPTIONAL)</Text>
            <Card style={styles.notesCard}>
              <View style={styles.notesRow}>
                <MessageSquare size={14} color={Colors.brownMuted} strokeWidth={1.8} />
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="e.g. 2-bedroom apartment, 3rd floor..."
                  placeholderTextColor={Colors.brownMuted}
                  multiline
                  style={styles.notesInput}
                  onFocus={() => {
                    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
                  }}
                />
              </View>
            </Card>

            <Pressable
              onPress={handleBook}
              disabled={submitting}
              style={({ pressed }) => [styles.bookBtn, pressed && styles.pressed, submitting && { opacity: 0.6 }]}
            >
              {submitting ? (
                <ActivityIndicator color={Colors.cream} />
              ) : (
                <Text variant="body" semibold color={Colors.cream}>Request Booking</Text>
              )}
            </Pressable>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  content: {
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
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  moverHeader: {
    marginBottom: Spacing.lg,
  },
  moverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.brown,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  dateCard: {
    marginBottom: Spacing.lg,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  slots: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    backgroundColor: Colors.overlay,
  },
  slotActive: {
    backgroundColor: Colors.brown,
  },
  notesCard: {
    marginBottom: Spacing.xl,
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  notesInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: Colors.brown,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  bookBtn: {
    backgroundColor: Colors.brown,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
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
  doneBtn: {
    backgroundColor: Colors.brown,
    borderRadius: Radius.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xxl,
    marginTop: Spacing.xl,
  },
});

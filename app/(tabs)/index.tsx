import { useCallback, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Pressable, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { CircleUserRound, PartyPopper, Clock, ArrowUpDown, X } from 'lucide-react-native';
import { ScreenContainer } from '@/components/ui/screen-container';
import { Text } from '@/components/ui/text';
import { CountdownCard } from '@/components/home/countdown-card';
import { ProgressCard } from '@/components/home/progress-card';
import { QuickActions } from '@/components/home/quick-actions';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useMove } from '@/hooks/use-move';
import { useTasks } from '@/hooks/use-tasks';
import { useUnread } from '@/hooks/use-unread';

function parseDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00');
}

function getDaysUntil(dateStr: string): number {
  const now = new Date();
  const diff = parseDate(dateStr).getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatDate(dateStr: string): string {
  return parseDate(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function formatShortDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { move, loading: moveLoading } = useMove();
  const { tasks, completed, total, loading: tasksLoading } = useTasks();
  const { unread, refetch: refetchUnread } = useUnread(move?.id);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useFocusEffect(
    useCallback(() => { refetchUnread(); }, [refetchUnread])
  );

  const loading = moveLoading || tasksLoading;

  return (
    <ScreenContainer style={{ paddingTop: insets.top + Spacing.md }}>
      <Pressable
        style={[styles.profileBtn, { top: insets.top + Spacing.md }]}
        onPress={() => router.push('/profile')}
        hitSlop={8}
      >
        <CircleUserRound size={26} color={Colors.brown} strokeWidth={1.5} />
      </Pressable>
      {loading ? (
        <ActivityIndicator color={Colors.brown} style={{ marginTop: Spacing.xxl }} />
      ) : (
        <>
          <Text variant="caption" color={Colors.brownMuted} style={styles.greeting}>
            {move ? `${move.unit?.building?.name ?? 'Your move'} — Unit ${move.unit?.number ?? ''}` : 'Your move at a glance'}
          </Text>

          {move?.status === 'confirmed' && !bannerDismissed && (
            <View style={styles.approvedBanner}>
              <Pressable
                style={styles.bannerClose}
                onPress={() => setBannerDismissed(true)}
                hitSlop={8}
              >
                <X size={14} color={Colors.brownMuted} strokeWidth={2} />
              </Pressable>
              <View style={styles.approvedIconWrap}>
                <PartyPopper size={22} color={Colors.brown} strokeWidth={1.8} />
              </View>
              <Text variant="body" semibold color={Colors.brown} center>
                You're approved!
              </Text>
              <Text variant="caption" color={Colors.brownMuted} center>
                Your move has been confirmed by management.{'\n'}You're all set for move day.
              </Text>
            </View>
          )}

          {move?.status === 'pending' && (
            <View style={styles.pendingBanner}>
              <Clock size={15} color={Colors.brownMuted} strokeWidth={1.8} />
              <Text variant="caption" color={Colors.brownMuted}>
                Awaiting approval from management
              </Text>
            </View>
          )}

          {move?.scheduled_date ? (
            <CountdownCard daysLeft={getDaysUntil(move.scheduled_date)} moveDate={formatDate(move.scheduled_date)} />
          ) : (
            <View style={styles.emptyCountdown}>
              <Text variant="title" center color={Colors.brownMuted}>No move scheduled yet</Text>
            </View>
          )}

          {total > 0 && move?.status === 'pending' && <ProgressCard completed={completed} total={total} />}

          {(() => {
            const elevatorTask = tasks.find((t) => t.type === 'schedule_elevator' && t.completed && t.response?.date);
            if (!elevatorTask) return null;
            const r = elevatorTask.response!;
            const today = new Date().toISOString().split('T')[0];
            if (r.date < today) return null;
            return (
              <View style={styles.elevatorCard}>
                <View style={styles.elevatorIconWrap}>
                  <ArrowUpDown size={16} color={Colors.brown} strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="caption" color={Colors.brownMuted}>Elevator booked</Text>
                  <Text variant="body" medium color={Colors.brown}>
                    {formatShortDate(r.date)} · {formatTime(r.start_time)} — {formatTime(r.end_time)}
                  </Text>
                </View>
              </View>
            );
          })()}

          <View style={styles.section}>
            <Text variant="label" color={Colors.brownMuted} style={styles.sectionLabel}>
              QUICK ACTIONS
            </Text>
            <QuickActions approved={move?.status === 'confirmed'} />
          </View>
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  profileBtn: {
    position: 'absolute',
    right: Spacing.lg,
    zIndex: 10,
    padding: Spacing.xs,
  },
  greeting: {
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  emptyCountdown: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
  approvedBanner: {
    alignItems: 'center',
    backgroundColor: Colors.greenLight,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    gap: Spacing.xs,
  },
  bannerClose: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    padding: Spacing.xs,
  },
  approvedIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.overlay,
    borderRadius: Radius.sm,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
    alignSelf: 'center',
  },
  elevatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.greenLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  elevatorIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionLabel: {
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },
});

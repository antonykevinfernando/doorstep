import { useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { CircleUserRound } from 'lucide-react-native';
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

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { move, loading: moveLoading } = useMove();
  const { completed, total, loading: tasksLoading } = useTasks();
  const { unread, refetch: refetchUnread } = useUnread(move?.id);

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

          {move?.scheduled_date ? (
            <CountdownCard daysLeft={getDaysUntil(move.scheduled_date)} moveDate={formatDate(move.scheduled_date)} />
          ) : (
            <View style={styles.emptyCountdown}>
              <Text variant="title" center color={Colors.brownMuted}>No move scheduled yet</Text>
            </View>
          )}

          {total > 0 && <ProgressCard completed={completed} total={total} />}

          <View style={styles.section}>
            <Text variant="label" color={Colors.brownMuted} style={styles.sectionLabel}>
              QUICK ACTIONS
            </Text>
            <QuickActions unread={unread} />
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
  section: {
    marginTop: Spacing.xl,
  },
  sectionLabel: {
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },
});

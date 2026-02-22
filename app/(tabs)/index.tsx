import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '@/components/ui/screen-container';
import { Text } from '@/components/ui/text';
import { CountdownCard } from '@/components/home/countdown-card';
import { ProgressCard } from '@/components/home/progress-card';
import { QuickActions } from '@/components/home/quick-actions';
import { Colors, Spacing } from '@/constants/theme';
import { useMove } from '@/hooks/use-move';
import { useTasks } from '@/hooks/use-tasks';

function getDaysUntil(dateStr: string): number {
  const now = new Date();
  const diff = new Date(dateStr).getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { move, loading: moveLoading } = useMove();
  const { completed, total, loading: tasksLoading } = useTasks();

  const loading = moveLoading || tasksLoading;

  return (
    <ScreenContainer style={{ paddingTop: insets.top + Spacing.xl }}>
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
            <QuickActions />
          </View>
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  greeting: {
    textAlign: 'center',
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

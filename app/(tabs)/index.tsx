import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '@/components/ui/screen-container';
import { Text } from '@/components/ui/text';
import { CountdownCard } from '@/components/home/countdown-card';
import { ProgressCard } from '@/components/home/progress-card';
import { QuickActions } from '@/components/home/quick-actions';
import { Colors, Spacing } from '@/constants/theme';
import { defaultTasks } from '@/data/tasks';

const MOVE_DATE = new Date('2026-04-15');

function getDaysUntil(date: Date): number {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const allTasks = defaultTasks.flatMap((c) => c.tasks);
  const completed = allTasks.filter((t) => t.completed).length;

  return (
    <ScreenContainer style={{ paddingTop: insets.top + Spacing.sm }}>
      <Text variant="caption" color={Colors.brownMuted} style={styles.greeting}>
        Your move at a glance
      </Text>

      <CountdownCard
        daysLeft={getDaysUntil(MOVE_DATE)}
        moveDate={formatDate(MOVE_DATE)}
      />

      <ProgressCard completed={completed} total={allTasks.length} />

      <View style={styles.section}>
        <Text variant="label" color={Colors.brownMuted} style={styles.sectionLabel}>
          QUICK ACTIONS
        </Text>
        <QuickActions />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  greeting: {
    textAlign: 'center',
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionLabel: {
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },
});

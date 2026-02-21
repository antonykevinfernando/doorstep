import { View, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Colors, Spacing } from '@/constants/theme';

interface ProgressCardProps {
  completed: number;
  total: number;
}

export function ProgressCard({ completed, total }: ProgressCardProps) {
  const progress = total > 0 ? completed / total : 0;

  return (
    <Card>
      <View style={styles.header}>
        <Text variant="caption" color={Colors.brownMuted}>
          Progress
        </Text>
        <Text variant="caption" semibold color={Colors.brown}>
          {Math.round(progress * 100)}%
        </Text>
      </View>
      <ProgressBar progress={progress} />
      <Text variant="caption" color={Colors.brownMuted} style={styles.detail}>
        {completed} of {total} tasks done
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm + 2,
  },
  detail: {
    marginTop: Spacing.sm,
  },
});

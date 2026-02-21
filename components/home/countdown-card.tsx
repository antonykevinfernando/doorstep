import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/text';
import { Colors, Spacing } from '@/constants/theme';

interface CountdownCardProps {
  daysLeft: number;
  moveDate: string;
}

export function CountdownCard({ daysLeft, moveDate }: CountdownCardProps) {
  return (
    <View style={styles.container}>
      <Text variant="hero" center style={styles.number}>
        {daysLeft}
      </Text>
      <Text variant="body" color={Colors.brownMuted} center>
        days until move day
      </Text>
      <View style={styles.datePill}>
        <Text variant="label" color={Colors.brownMuted}>
          {moveDate.toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  number: {
    marginBottom: -4,
  },
  datePill: {
    marginTop: Spacing.md,
    backgroundColor: Colors.overlay,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
  },
});

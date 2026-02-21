import { View, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { Text } from './text';

interface BadgeProps {
  label: string;
  color?: string;
  bg?: string;
}

export function Badge({
  label,
  color = Colors.brownLight,
  bg = Colors.overlay,
}: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text variant="label" color={color}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
});

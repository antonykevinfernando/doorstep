import { Pressable, View, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Colors, Spacing } from '@/constants/theme';

interface TaskItemProps {
  title: string;
  completed: boolean;
  onToggle: () => void;
}

export function TaskItem({ title, completed, onToggle }: TaskItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
      onPress={onToggle}
    >
      <View style={[styles.circle, completed && styles.circleChecked]}>
        {completed && <Check size={12} color={Colors.cream} strokeWidth={3} />}
      </View>
      <Text
        variant="body"
        color={completed ? Colors.brownMuted : Colors.brown}
        style={completed ? styles.done : undefined}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: Spacing.md,
  },
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleChecked: {
    backgroundColor: Colors.brown,
    borderColor: Colors.brown,
  },
  done: {
    textDecorationLine: 'line-through',
  },
});

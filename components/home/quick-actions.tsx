import { View, Pressable, StyleSheet } from 'react-native';
import { ClipboardList, Landmark, ArrowRight, Wrench, Activity } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Colors, Spacing, Radius } from '@/constants/theme';

const preApprovalActions = [
  { icon: ClipboardList, label: 'Tasks', route: '/(tabs)/tasks' as const },
  { icon: Activity, label: 'Activity', route: '/activity' as const },
  { icon: Landmark, label: 'Building Info', route: '/(tabs)/documents' as const },
];

const postApprovalActions = [
  { icon: Wrench, label: 'Services', route: '/services' as const },
  { icon: Activity, label: 'Activity', route: '/activity' as const },
  { icon: Landmark, label: 'Building Info', route: '/(tabs)/documents' as const },
];

export function QuickActions({ approved = false }: { approved?: boolean }) {
  const router = useRouter();

  const actions = approved ? postApprovalActions : preApprovalActions;

  return (
    <View style={styles.list}>
      {actions.map((action) => (
        <Pressable
          key={action.label}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          onPress={() => router.push(action.route)}
        >
          <View style={styles.iconWrap}>
            <action.icon size={18} color={Colors.brown} strokeWidth={1.8} />
          </View>
          <Text variant="body" medium style={styles.label}>
            {action.label}
          </Text>
          <ArrowRight size={16} color={Colors.brownMuted} strokeWidth={1.5} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glass,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
  },
});

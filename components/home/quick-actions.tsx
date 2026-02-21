import { View, Pressable, StyleSheet } from 'react-native';
import { ClipboardList, PackagePlus, Truck, ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Colors, Spacing, Radius } from '@/constants/theme';

const actions = [
  { icon: ClipboardList, label: 'Tasks', route: '/(tabs)/tasks' as const },
  { icon: PackagePlus, label: 'Add Box', route: '/add-box' as const },
  { icon: Truck, label: 'Movers', route: '/(tabs)/movers' as const },
];

export function QuickActions() {
  const router = useRouter();

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

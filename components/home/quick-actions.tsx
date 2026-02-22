import { View, Pressable, StyleSheet, Text as RNText } from 'react-native';
import { ClipboardList, PackagePlus, MessageCircle, ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Colors, Spacing, Radius, FontFamily } from '@/constants/theme';

const actions = [
  { icon: ClipboardList, label: 'Tasks', route: '/(tabs)/tasks' as const },
  { icon: MessageCircle, label: 'Messages', route: '/messages-screen' as const, badge: true },
  { icon: PackagePlus, label: 'Add Box', route: '/add-box' as const },
];

export function QuickActions({ unread = 0 }: { unread?: number }) {
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
          {action.badge && unread > 0 && (
            <View style={styles.badge}>
              <RNText style={styles.badgeText}>
                {unread > 99 ? '99+' : String(unread)}
              </RNText>
            </View>
          )}
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
  badge: {
    backgroundColor: '#E35D5D',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    fontFamily: FontFamily.regular,
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

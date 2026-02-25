import { useCallback } from 'react';
import { View, StyleSheet, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { BlurView } from 'expo-blur';
import {
  ArrowLeft,
  ArrowUpDown,
  Truck,
  KeyRound,
  BellRing,
  ChevronRight,
  Inbox,
} from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Colors, Spacing, Radius, Grid } from '@/constants/theme';
import { useActivity, type ActivityItem } from '@/hooks/use-activity';

const iconMap = {
  elevator: ArrowUpDown,
  mover: Truck,
  service_request: BellRing,
};

const colorMap: Record<string, string> = {
  elevator: '#E8F5DC',
  mover: '#FEF3C7',
  service_request: '#E0F2FE',
};

const statusStyle: Record<string, { bg: string; fg: string }> = {
  booked: { bg: '#E8F5DC', fg: '#5A8A3C' },
  sent: { bg: '#E0F2FE', fg: '#2563EB' },
  pending: { bg: '#FEF3C7', fg: '#92702B' },
  confirmed: { bg: '#E8F5DC', fg: '#5A8A3C' },
  completed: { bg: Colors.overlay, fg: Colors.brownMuted },
  cancelled: { bg: '#FEE2E2', fg: '#DC2626' },
};

function getServiceIcon(title: string) {
  if (title.includes('Key') || title.includes('Fob')) return KeyRound;
  if (title.includes('Buzzer')) return BellRing;
  if (title.includes('Elevator')) return ArrowUpDown;
  return BellRing;
}

function ActivityRow({ item, onPress }: { item: ActivityItem; onPress: () => void }) {
  const Icon = item.type === 'service_request' ? getServiceIcon(item.title) : iconMap[item.type];
  const bg = item.type === 'service_request'
    ? (item.title.includes('Key') || item.title.includes('Fob') ? '#FEF3C7' : item.title.includes('Elevator') ? '#E8F5DC' : '#E0F2FE')
    : colorMap[item.type];
  const st = statusStyle[item.status] ?? statusStyle.sent;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={[styles.iconWrap, { backgroundColor: bg }]}>
        <Icon size={18} color={Colors.brown} strokeWidth={1.8} />
      </View>
      <View style={styles.rowText}>
        <Text variant="body" medium color={Colors.brown} numberOfLines={1}>{item.title}</Text>
        <Text variant="caption" color={Colors.brownMuted} numberOfLines={1}>{item.subtitle}</Text>
      </View>
      <View style={[styles.statusPill, { backgroundColor: st.bg }]}>
        <Text variant="label" color={st.fg}>
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </Text>
      </View>
      <ChevronRight size={16} color={Colors.brownMuted} strokeWidth={1.5} />
    </Pressable>
  );
}

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { items, loading, refetch } = useActivity();

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  return (
    <View style={[styles.screen, { paddingTop: insets.top + Spacing.sm }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={({ pressed }) => pressed && { opacity: 0.6 }}>
          <BlurView intensity={40} tint="light" style={styles.backBlur}>
            <ArrowLeft size={20} color={Colors.brown} strokeWidth={1.8} />
          </BlurView>
        </Pressable>
        <Text variant="title" color={Colors.brown}>Activity</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.brown} style={{ marginTop: Spacing.xxl }} />
      ) : items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIcon}>
            <Inbox size={32} color={Colors.brownMuted} strokeWidth={1.5} />
          </View>
          <Text variant="body" color={Colors.brownMuted} center>No requests yet</Text>
          <Text variant="caption" color={Colors.brownMuted} center style={{ marginTop: 2 }}>
            Your bookings and service requests{'\n'}will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <ActivityRow
              item={item}
              onPress={() => router.push({ pathname: '/activity/[id]', params: { id: item.id, data: JSON.stringify(item) } })}
            />
          )}
          contentContainerStyle={{ gap: Spacing.sm, paddingBottom: insets.bottom + Spacing.xl }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.cream,
    paddingHorizontal: Grid.margin,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  backBlur: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  rowPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 1,
  },
  statusPill: {
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
});

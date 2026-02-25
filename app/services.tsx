import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import {
  ArrowLeft,
  ArrowUpDown,
  KeyRound,
  BellRing,
  ChevronRight,
  Wrench,
} from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Colors, Spacing, Radius, Grid } from '@/constants/theme';

const services = [
  {
    icon: ArrowUpDown,
    label: 'Book Elevator',
    tagline: 'Reserve freight elevator',
    color: '#E8F5DC',
    route: '/services/elevator' as const,
  },
  {
    icon: KeyRound,
    label: 'Keys & Fobs',
    tagline: 'Request additional access',
    color: '#FEF3C7',
    route: '/services/keyfob' as const,
  },
  {
    icon: BellRing,
    label: 'Buzzer',
    tagline: 'Update buzzer details',
    color: '#E0F2FE',
    route: '/services/buzzer' as const,
  },
];

export default function ServicesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <ScrollView
      style={[styles.screen, { paddingTop: insets.top + Spacing.sm }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
      showsVerticalScrollIndicator={false}
    >
      <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
        <BlurView intensity={40} tint="light" style={styles.backBlur}>
          <ArrowLeft size={20} color={Colors.brown} strokeWidth={1.8} />
        </BlurView>
      </Pressable>

      <View style={styles.hero}>
        <View style={styles.heroIconWrap}>
          <Wrench size={28} color={Colors.brown} strokeWidth={1.5} />
        </View>
        <Text variant="title" color={Colors.brown}>Building Services</Text>
        <Text variant="caption" color={Colors.brownMuted}>
          Manage your unit's services and requests
        </Text>
      </View>

      <View style={styles.grid}>
        {services.map((svc) => (
          <Pressable
            key={svc.label}
            onPress={() => router.push(svc.route)}
            style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
          >
            <BlurView intensity={50} tint="light" style={styles.tileBlur}>
              <View style={styles.tileInner}>
                <View style={[styles.tileIcon, { backgroundColor: svc.color }]}>
                  <svc.icon size={22} color={Colors.brown} strokeWidth={1.8} />
                </View>
                <Text variant="body" semibold color={Colors.brown} style={{ marginTop: Spacing.md }}>
                  {svc.label}
                </Text>
                <Text variant="caption" color={Colors.brownMuted}>
                  {svc.tagline}
                </Text>
                <View style={styles.tileArrow}>
                  <ChevronRight size={16} color={Colors.brownMuted} strokeWidth={1.5} />
                </View>
              </View>
            </BlurView>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.cream,
    paddingHorizontal: Grid.margin,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
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
  hero: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: 4,
  },
  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  grid: {
    gap: Spacing.md,
  },
  tile: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  tilePressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  tileBlur: {
    overflow: 'hidden',
  },
  tileInner: {
    backgroundColor: Colors.glass,
    padding: Spacing.lg,
    minHeight: 130,
  },
  tileIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileArrow: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
  },
});

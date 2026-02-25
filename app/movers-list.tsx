import { View, StyleSheet, Pressable, ActivityIndicator, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { ArrowLeft, Star, Truck, ChevronRight } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Colors, Spacing, Radius, Grid } from '@/constants/theme';
import { useMovers, type Mover } from '@/hooks/use-movers';

function formatPrice(mover: Mover): string {
  if (mover.priceRangeMin != null && mover.priceRangeMax != null) {
    return `$${mover.priceRangeMin} – $${mover.priceRangeMax} / hr`;
  }
  if (mover.priceRangeMin != null) return `From $${mover.priceRangeMin} / hr`;
  if (mover.priceRangeMax != null) return `Up to $${mover.priceRangeMax} / hr`;
  return 'Contact for pricing';
}

function MoverRow({ mover, onPress }: { mover: Mover; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <Card style={styles.moverCard}>
        <View style={styles.row}>
          <View style={styles.avatar}>
            <Truck size={18} color={Colors.cream} strokeWidth={1.8} />
          </View>
          <View style={styles.info}>
            <Text variant="body" semibold color={Colors.brown}>{mover.companyName}</Text>
            {mover.serviceArea && (
              <Text variant="caption" color={Colors.brownMuted}>{mover.serviceArea}</Text>
            )}
            <View style={styles.pricePill}>
              <Text variant="label" color={Colors.brownLight}>{formatPrice(mover)}</Text>
            </View>
          </View>
          <ChevronRight size={18} color={Colors.brownMuted} strokeWidth={1.8} />
        </View>
        {!!mover.description && (
          <Text variant="caption" color={Colors.brownMuted} numberOfLines={2} style={{ marginTop: Spacing.sm }}>
            {mover.description}
          </Text>
        )}
      </Card>
    </Pressable>
  );
}

export default function MoversListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { movers, loading } = useMovers();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <FlatList
        data={movers}
        keyExtractor={(m) => m.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
              <BlurView intensity={40} tint="light" style={styles.backBlur}>
                <ArrowLeft size={20} color={Colors.brown} strokeWidth={1.8} />
              </BlurView>
            </Pressable>
            <Text variant="title" color={Colors.brown} style={{ marginTop: Spacing.md }}>
              Local Movers
            </Text>
            <Text variant="caption" color={Colors.brownMuted} style={{ marginTop: 2 }}>
              {movers.length} mover{movers.length !== 1 ? 's' : ''} available near you
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <MoverRow mover={item} onPress={() => router.push(`/book-mover/${item.id}`)} />
        )}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={Colors.brown} style={{ marginTop: Spacing.xxl }} />
          ) : (
            <View style={styles.empty}>
              <Truck size={32} color={Colors.brownMuted} strokeWidth={1.5} />
              <Text variant="body" color={Colors.brownMuted} center style={{ marginTop: Spacing.md }}>
                No movers available yet.{'\n'}Check back soon!
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  list: {
    paddingHorizontal: Grid.margin,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  backBtn: {
    alignSelf: 'flex-start',
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
  moverCard: {
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.brown,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  pricePill: {
    marginTop: 4,
    backgroundColor: Colors.overlay,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
});

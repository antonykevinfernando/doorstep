import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Dimensions,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import {
  Truck,
  Tag,
  Utensils,
  Sparkles,
  Dumbbell,
  Sofa,
  Wrench,
  Cpu,
  MoreHorizontal,
  ChevronRight,
  Percent,
  Clock,
} from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { useDeals, type Deal } from '@/hooks/use-deals';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.72;
const CARD_GAP = Spacing.md;

const CATEGORIES = [
  { key: 'all', label: 'All', icon: Tag },
  { key: 'Food & Dining', label: 'Food', icon: Utensils },
  { key: 'Cleaning', label: 'Clean', icon: Sparkles },
  { key: 'Fitness', label: 'Fitness', icon: Dumbbell },
  { key: 'Furniture', label: 'Furniture', icon: Sofa },
  { key: 'Home Services', label: 'Home', icon: Wrench },
  { key: 'Electronics', label: 'Tech', icon: Cpu },
  { key: 'Other', label: 'More', icon: MoreHorizontal },
];

function getTimeLeft(expiresAt: string | null): string | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 0) return `${days}d left`;
  const hrs = Math.floor(diff / (1000 * 60 * 60));
  return `${hrs}h left`;
}

function FeaturedCarousel({ deals, onPress }: { deals: Deal[]; onPress: (id: string) => void }) {
  const scrollRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (deals.length <= 1) return;
    const interval = setInterval(() => {
      const next = (activeIndex + 1) % deals.length;
      scrollRef.current?.scrollToOffset({ offset: next * (CARD_WIDTH + CARD_GAP), animated: true });
      setActiveIndex(next);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeIndex, deals.length]);

  if (deals.length === 0) return null;

  return (
    <View style={styles.carouselWrap}>
      <FlatList
        ref={scrollRef}
        data={deals}
        keyExtractor={(d) => d.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + CARD_GAP}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: Spacing.lg }}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / (CARD_WIDTH + CARD_GAP));
          setActiveIndex(idx);
        }}
        renderItem={({ item }) => {
          const timeLeft = getTimeLeft(item.expiresAt);
          return (
            <Pressable onPress={() => onPress(item.id)} style={({ pressed }) => [styles.featuredCard, pressed && styles.pressed]}>
              <BlurView intensity={50} tint="light" style={styles.featuredBlur}>
                <View style={styles.featuredInner}>
                  <View style={styles.featuredTop}>
                    <View style={styles.vendorPill}>
                      <Text variant="label" color={Colors.brownLight}>{item.vendor.businessName}</Text>
                    </View>
                    {item.discountPct && (
                      <View style={styles.discountBadge}>
                        <Percent size={10} color="#fff" strokeWidth={2.5} />
                        <Text variant="label" color="#fff">{item.discountPct}% OFF</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.featuredBottom}>
                    <Text variant="subtitle" color={Colors.brown} numberOfLines={2}>{item.title}</Text>
                    <View style={styles.featuredMeta}>
                      {item.dealPrice != null && (
                        <View style={styles.priceRow}>
                          {item.originalPrice != null && (
                            <Text variant="caption" color={Colors.brownMuted} style={styles.strikethrough}>${item.originalPrice}</Text>
                          )}
                          <Text variant="body" semibold color={Colors.brown}>${item.dealPrice}</Text>
                        </View>
                      )}
                      {timeLeft && (
                        <View style={styles.timePill}>
                          <Clock size={10} color={Colors.brownMuted} strokeWidth={2} />
                          <Text variant="label" color={Colors.brownMuted}>{timeLeft}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </BlurView>
            </Pressable>
          );
        }}
      />
      {deals.length > 1 && (
        <View style={styles.dots}>
          {deals.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function MoverSpotlight({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <View style={styles.moverCard}>
        <BlurView intensity={30} tint="light" style={styles.moverBlur}>
          <View style={styles.moverInner}>
            <View style={styles.moverIconWrap}>
              <Truck size={22} color={Colors.brown} strokeWidth={1.8} />
            </View>
            <View style={styles.moverText}>
              <Text variant="body" semibold color={Colors.brown}>Need a mover?</Text>
              <Text variant="caption" color={Colors.brownMuted}>Browse & book trusted local movers</Text>
            </View>
            <ChevronRight size={18} color={Colors.brownMuted} strokeWidth={1.8} />
          </View>
        </BlurView>
      </View>
    </Pressable>
  );
}

function DealCard({ deal, onPress }: { deal: Deal; onPress: () => void }) {
  const timeLeft = getTimeLeft(deal.expiresAt);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.gridCard, pressed && styles.pressed]}>
      <View style={styles.gridCardOuter}>
        <BlurView intensity={50} tint="light" style={styles.gridCardBlur}>
          <View style={styles.gridCardInner}>
            <View style={styles.gridCardTop}>
              <View style={styles.vendorPill}>
                <Text variant="label" color={Colors.brownLight} numberOfLines={1}>{deal.vendor.businessName}</Text>
              </View>
              {deal.discountPct ? (
                <View style={styles.discountBadge}>
                  <Percent size={8} color="#fff" strokeWidth={2.5} />
                  <Text variant="label" color="#fff">{deal.discountPct}%</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.gridCardBottom}>
              <Text variant="body" medium color={Colors.brown} numberOfLines={2}>{deal.title}</Text>
              <View style={styles.gridCardMeta}>
                {deal.dealPrice != null ? (
                  <View style={styles.priceRow}>
                    {deal.originalPrice != null && (
                      <Text variant="caption" color={Colors.brownMuted} style={styles.strikethrough}>${deal.originalPrice}</Text>
                    )}
                    <Text variant="body" semibold color={Colors.brown}>${deal.dealPrice}</Text>
                  </View>
                ) : deal.discountPct ? (
                  <Text variant="caption" semibold color={Colors.brown}>{deal.discountPct}% off</Text>
                ) : (
                  <Text variant="caption" color={Colors.brownMuted}>See details</Text>
                )}
                {timeLeft && (
                  <View style={styles.timePill}>
                    <Clock size={9} color={Colors.brownMuted} strokeWidth={2} />
                    <Text variant="label" color={Colors.brownMuted}>{timeLeft}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </BlurView>
      </View>
    </Pressable>
  );
}

export default function MarketplaceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('all');
  const { deals, loading, refetch } = useDeals(activeCategory === 'all' ? undefined : activeCategory);

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  const featured = deals.slice(0, 5);
  const grid = deals;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        <View style={styles.header}>
          <Text variant="title" color={Colors.brown}>Marketplace</Text>
          <Text variant="caption" color={Colors.brownMuted} style={{ marginTop: 2 }}>
            Deals & services in your neighbourhood
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categories}
        >
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.key;
            return (
              <Pressable
                key={cat.key}
                onPress={() => setActiveCategory(cat.key)}
                style={[styles.categoryPill, isActive && styles.categoryPillActive]}
              >
                <Icon size={14} color={isActive ? Colors.cream : Colors.brownMuted} strokeWidth={1.8} />
                <Text
                  variant="label"
                  color={isActive ? Colors.cream : Colors.brownMuted}
                  style={{ marginLeft: 4 }}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {loading ? (
          <ActivityIndicator color={Colors.brown} style={{ marginTop: Spacing.xxl }} />
        ) : (
          <>
            {featured.length > 0 && (
              <>
                <Text variant="label" color={Colors.brownMuted} style={styles.sectionLabel}>FEATURED</Text>
                <FeaturedCarousel deals={featured} onPress={(id) => router.push(`/deal/${id}`)} />
              </>
            )}

            <MoverSpotlight onPress={() => router.push('/movers-list')} />

            {grid.length > 0 && (
              <>
                <Text variant="label" color={Colors.brownMuted} style={styles.sectionLabel}>ALL DEALS</Text>
                <View style={styles.grid}>
                  {grid.map((deal) => (
                    <DealCard key={deal.id} deal={deal} onPress={() => router.push(`/deal/${deal.id}`)} />
                  ))}
                </View>
              </>
            )}

            {deals.length === 0 && (
              <View style={styles.empty}>
                <Tag size={32} color={Colors.brownMuted} strokeWidth={1.5} />
                <Text variant="body" color={Colors.brownMuted} center style={{ marginTop: Spacing.md }}>
                  No deals available yet.{'\n'}Check back soon!
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  categories: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.overlay,
  },
  categoryPillActive: {
    backgroundColor: Colors.brown,
  },
  sectionLabel: {
    marginLeft: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  carouselWrap: {
    marginBottom: Spacing.sm,
  },
  featuredCard: {
    width: CARD_WIDTH,
    marginRight: CARD_GAP,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  featuredBlur: {
    overflow: 'hidden',
  },
  featuredInner: {
    backgroundColor: Colors.glass,
    padding: Spacing.lg,
    minHeight: 160,
    justifyContent: 'space-between',
  },
  featuredTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  vendorPill: {
    backgroundColor: Colors.overlay,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.brown,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  featuredBottom: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.overlay,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.brownMuted,
    opacity: 0.3,
  },
  dotActive: {
    opacity: 1,
    backgroundColor: Colors.brown,
    width: 18,
  },
  moverCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(210, 237, 191, 0.6)',
  },
  moverBlur: {
    overflow: 'hidden',
  },
  moverInner: {
    backgroundColor: Colors.greenLight,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  moverIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moverText: {
    flex: 1,
    gap: 2,
  },
  grid: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  gridCard: {
    width: '100%',
  },
  gridCardOuter: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  gridCardBlur: {
    overflow: 'hidden',
  },
  gridCardInner: {
    backgroundColor: Colors.glass,
    padding: Spacing.lg,
    minHeight: 220,
    justifyContent: 'space-between',
  },
  gridCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  gridCardBottom: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  gridCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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

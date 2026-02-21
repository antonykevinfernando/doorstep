import { View, Pressable, StyleSheet } from 'react-native';
import { Star, ArrowUpRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Colors, Spacing, Radius } from '@/constants/theme';
import type { Mover } from '@/data/movers';

interface MoverCardProps {
  mover: Mover;
}

export function MoverCard({ mover }: MoverCardProps) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(`/mover/${mover.id}`)}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Card style={styles.card}>
        <View style={styles.top}>
          <View style={styles.avatar}>
            <Text variant="subtitle" color={Colors.cream}>
              {mover.name.charAt(0)}
            </Text>
          </View>
          <View style={styles.info}>
            <Text variant="body" semibold>{mover.name}</Text>
            <View style={styles.ratingRow}>
              <Star size={12} color={Colors.brown} fill={Colors.green} />
              <Text variant="caption" medium>{mover.rating}</Text>
              <Text variant="caption" color={Colors.brownMuted}>
                · {mover.reviewCount}
              </Text>
            </View>
          </View>
          <ArrowUpRight size={18} color={Colors.brownMuted} strokeWidth={1.8} />
        </View>
        <View style={styles.pricePill}>
          <Text variant="label" color={Colors.brownLight}>
            {mover.priceRange}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.brown,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 3,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pricePill: {
    marginTop: Spacing.sm + 2,
    backgroundColor: Colors.overlay,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    alignSelf: 'flex-start',
  },
});

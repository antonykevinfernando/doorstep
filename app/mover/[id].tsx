import { View, StyleSheet, Linking } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Star, Phone, Check } from 'lucide-react-native';
import { ScreenContainer } from '@/components/ui/screen-container';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { movers } from '@/data/movers';
import { Colors, Spacing, Radius } from '@/constants/theme';

export default function MoverDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const mover = movers.find((m) => m.id === id);

  if (!mover) {
    return (
      <ScreenContainer>
        <Text variant="body" center color={Colors.brownMuted}>
          Mover not found
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.avatarRow}>
        <View style={styles.avatar}>
          <Text variant="title" color={Colors.cream}>
            {mover.name.charAt(0)}
          </Text>
        </View>
      </View>

      <Text variant="title" center>{mover.name}</Text>

      <View style={styles.meta}>
        <View style={styles.pill}>
          <Star size={12} color={Colors.brown} fill={Colors.green} />
          <Text variant="caption" medium>{mover.rating}</Text>
        </View>
        <View style={styles.pill}>
          <Text variant="caption" color={Colors.brownMuted}>{mover.reviewCount} reviews</Text>
        </View>
        <View style={styles.pill}>
          <Text variant="caption" color={Colors.brownLight}>{mover.priceRange}</Text>
        </View>
      </View>

      <Text variant="body" color={Colors.brownMuted} center style={styles.desc}>
        {mover.description}
      </Text>

      <Text variant="label" color={Colors.brownMuted} style={styles.sectionLabel}>
        SERVICES
      </Text>
      <Card>
        {mover.services.map((service, i) => (
          <View key={i} style={[styles.serviceRow, i > 0 && styles.serviceBorder]}>
            <Check size={14} color={Colors.greenDark} strokeWidth={2.5} />
            <Text variant="body">{service}</Text>
          </View>
        ))}
      </Card>

      <View style={styles.cta}>
        <Button
          title="Get a Quote"
          fullWidth
          icon={<Phone size={16} color={Colors.cream} strokeWidth={2} />}
          onPress={() => Linking.openURL(`tel:${mover.phone}`)}
        />
        <Button
          title="Call Now"
          variant="secondary"
          fullWidth
          onPress={() => Linking.openURL(`tel:${mover.phone}`)}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  avatarRow: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.brown,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    flexWrap: 'wrap',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.overlay,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
  },
  desc: {
    marginTop: Spacing.xl,
    marginHorizontal: Spacing.md,
  },
  sectionLabel: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
    marginLeft: 2,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + 2,
    paddingVertical: 10,
  },
  serviceBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cta: {
    marginTop: Spacing.xxl,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
});

import { useState } from 'react';
import { View, StyleSheet, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import {
  ArrowLeft,
  Store,
  Tag,
  Clock,
  Copy,
  Check,
  ExternalLink,
  Percent,
} from 'lucide-react-native';
import { ScreenContainer } from '@/components/ui/screen-container';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useDeal } from '@/hooks/use-deals';
import { ActivityIndicator } from 'react-native';

function getTimeLeft(expiresAt: string | null): string | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 0) return `${days} day${days !== 1 ? 's' : ''} left`;
  const hrs = Math.floor(diff / (1000 * 60 * 60));
  return `${hrs} hour${hrs !== 1 ? 's' : ''} left`;
}

export default function DealDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { deal, loading } = useDeal(id);
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    if (!deal?.redemptionCode) return;
    await Clipboard.setStringAsync(deal.redemptionCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function openLink() {
    if (!deal?.redemptionLink) return;
    try {
      await Linking.openURL(deal.redemptionLink);
    } catch {
      Alert.alert('Could not open link');
    }
  }

  return (
    <ScreenContainer style={{ paddingTop: insets.top + Spacing.sm }}>
      <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
        <BlurView intensity={40} tint="light" style={styles.backBlur}>
          <ArrowLeft size={20} color={Colors.brown} strokeWidth={1.8} />
        </BlurView>
      </Pressable>

      {loading ? (
        <ActivityIndicator color={Colors.brown} style={{ marginTop: Spacing.xxl }} />
      ) : !deal ? (
        <View style={styles.empty}>
          <Text variant="body" color={Colors.brownMuted}>Deal not found</Text>
        </View>
      ) : (
        <>
          <View style={styles.heroSection}>
            <View style={styles.heroIcon}>
              <Tag size={32} color={Colors.brown} strokeWidth={1.5} />
            </View>
            {deal.discountPct && (
              <View style={styles.heroBadge}>
                <Percent size={12} color="#fff" strokeWidth={2.5} />
                <Text variant="body" semibold color="#fff">{deal.discountPct}% OFF</Text>
              </View>
            )}
          </View>

          <Text variant="title" color={Colors.brown} style={styles.title}>{deal.title}</Text>

          <View style={styles.vendorRow}>
            <View style={styles.vendorAvatar}>
              <Store size={14} color={Colors.brownMuted} strokeWidth={1.8} />
            </View>
            <View>
              <Text variant="body" medium color={Colors.brown}>{deal.vendor.businessName}</Text>
              <Text variant="caption" color={Colors.brownMuted}>{deal.vendor.category}</Text>
            </View>
          </View>

          {(deal.dealPrice != null || deal.originalPrice != null) && (
            <Card style={styles.priceCard}>
              <View style={styles.priceInner}>
                {deal.originalPrice != null && (
                  <Text variant="subtitle" color={Colors.brownMuted} style={styles.strikethrough}>
                    ${deal.originalPrice}
                  </Text>
                )}
                {deal.dealPrice != null && (
                  <Text variant="title" color={Colors.brown}>${deal.dealPrice}</Text>
                )}
              </View>
              {deal.expiresAt && (
                <View style={styles.expiryRow}>
                  <Clock size={12} color={Colors.brownMuted} strokeWidth={2} />
                  <Text variant="caption" color={Colors.brownMuted}>{getTimeLeft(deal.expiresAt)}</Text>
                </View>
              )}
            </Card>
          )}

          {!!deal.description && (
            <View style={styles.section}>
              <Text variant="label" color={Colors.brownMuted} style={styles.sectionLabel}>ABOUT THIS DEAL</Text>
              <Text variant="body" color={Colors.brown}>{deal.description}</Text>
            </View>
          )}

          {!!deal.terms && (
            <View style={styles.section}>
              <Text variant="label" color={Colors.brownMuted} style={styles.sectionLabel}>TERMS & CONDITIONS</Text>
              <Text variant="caption" color={Colors.brownMuted}>{deal.terms}</Text>
            </View>
          )}

          {(!!deal.redemptionCode || !!deal.redemptionLink) && (
            <View style={styles.ctaSection}>
              {!!deal.redemptionCode && (
                <Pressable onPress={copyCode} style={({ pressed }) => [styles.ctaBtn, pressed && styles.ctaPressed]}>
                  <View style={styles.codeBox}>
                    <Text variant="subtitle" color={Colors.brown}>{deal.redemptionCode}</Text>
                  </View>
                  <View style={styles.copyBtn}>
                    {copied ? (
                      <Check size={18} color={Colors.cream} strokeWidth={2} />
                    ) : (
                      <Copy size={18} color={Colors.cream} strokeWidth={1.8} />
                    )}
                    <Text variant="body" semibold color={Colors.cream}>
                      {copied ? 'Copied!' : 'Copy Code'}
                    </Text>
                  </View>
                </Pressable>
              )}
              {!!deal.redemptionLink && (
                <Pressable onPress={openLink} style={({ pressed }) => [styles.linkBtn, pressed && styles.ctaPressed]}>
                  <ExternalLink size={16} color={Colors.brown} strokeWidth={1.8} />
                  <Text variant="body" medium color={Colors.brown}>Redeem Online</Text>
                </Pressable>
              )}
            </View>
          )}
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.brown,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    marginTop: Spacing.md,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  vendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  vendorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceCard: {
    marginBottom: Spacing.lg,
  },
  priceInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.sm,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    marginBottom: Spacing.sm,
  },
  ctaSection: {
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  ctaBtn: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  ctaPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  codeBox: {
    backgroundColor: Colors.overlay,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.brown,
    paddingVertical: 14,
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.greenLight,
    paddingVertical: 14,
    borderRadius: Radius.md,
  },
});

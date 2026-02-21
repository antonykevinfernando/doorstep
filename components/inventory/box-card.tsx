import { View, Pressable, StyleSheet } from 'react-native';
import { Package, X } from 'lucide-react-native';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Colors, Spacing, Radius } from '@/constants/theme';

export interface Box {
  id: string;
  label: string;
  room: string;
  items: string[];
}

interface BoxCardProps {
  box: Box;
  onDelete: (id: string) => void;
}

export function BoxCard({ box, onDelete }: BoxCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <View style={styles.iconWrap}>
          <Package size={18} color={Colors.brown} strokeWidth={1.8} />
        </View>
        <View style={styles.info}>
          <Text variant="body" semibold>
            {box.label}
          </Text>
          <Text variant="caption" color={Colors.brownMuted}>
            {box.room}
          </Text>
        </View>
        <Pressable
          onPress={() => onDelete(box.id)}
          hitSlop={16}
          style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.4 }]}
        >
          <X size={14} color={Colors.brownMuted} strokeWidth={2} />
        </Pressable>
      </View>
      {box.items.length > 0 && (
        <Text variant="caption" color={Colors.brownMuted} style={styles.items} numberOfLines={2}>
          {box.items.join('  ·  ')}
        </Text>
      )}
      <View style={styles.countPill}>
        <Text variant="label" color={Colors.brownLight}>
          {box.items.length} {box.items.length === 1 ? 'item' : 'items'}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  items: {
    marginTop: Spacing.sm + 2,
  },
  countPill: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.overlay,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    alignSelf: 'flex-start',
  },
});

import { useState } from 'react';
import { View, FlatList, StyleSheet, Pressable } from 'react-native';
import { PackageOpen, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { BoxCard, type Box } from '@/components/inventory/box-card';
import { Colors, Spacing, Grid, Radius } from '@/constants/theme';

const initialBoxes: Box[] = [
  { id: '1', label: 'Kitchen Essentials', room: 'Kitchen', items: ['Plates', 'Cups', 'Cutlery', 'Pots'] },
  { id: '2', label: 'Bedroom Linens', room: 'Bedroom', items: ['Sheets', 'Pillows', 'Blankets'] },
  { id: '3', label: 'Books & Media', room: 'Living Room', items: ['Novels', 'DVDs', 'Board games'] },
];

export default function InventoryScreen() {
  const [boxes, setBoxes] = useState<Box[]>(initialBoxes);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const totalItems = boxes.reduce((sum, b) => sum + b.items.length, 0);

  return (
    <View style={styles.screen}>
      <FlatList
        data={boxes}
        keyExtractor={(b) => b.id}
        contentContainerStyle={[
          styles.list,
          { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View>
                <Text variant="title">Inventory</Text>
                <Text variant="caption" color={Colors.brownMuted} style={styles.sub}>
                  {boxes.length} boxes · {totalItems} items
                </Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }]}
                onPress={() => router.push('/add-box')}
              >
                <Plus size={20} color={Colors.cream} strokeWidth={2.5} />
              </Pressable>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <PackageOpen size={40} color={Colors.brownMuted} strokeWidth={1.5} />
            <Text variant="body" color={Colors.brownMuted} center>
              No boxes yet
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <BoxCard box={item} onDelete={(id) => setBoxes((p) => p.filter((b) => b.id !== id))} />
        )}
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sub: {
    marginTop: Spacing.xs,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.brown,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 100,
    gap: Spacing.md,
  },
});

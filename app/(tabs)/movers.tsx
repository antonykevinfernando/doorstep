import { View, FlatList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { MoverCard } from '@/components/movers/mover-card';
import { movers } from '@/data/movers';
import { Colors, Spacing, Grid } from '@/constants/theme';

export default function MoversScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <FlatList
        data={movers}
        keyExtractor={(m) => m.id}
        contentContainerStyle={[
          styles.list,
          { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text variant="title">Movers</Text>
            <Text variant="caption" color={Colors.brownMuted} style={styles.sub}>
              {movers.length} available near you
            </Text>
          </View>
        }
        renderItem={({ item }) => <MoverCard mover={item} />}
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
    marginBottom: Spacing.xl,
  },
  sub: {
    marginTop: Spacing.xs,
  },
});

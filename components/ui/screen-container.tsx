import { View, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Grid, Spacing } from '@/constants/theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
}

export function ScreenContainer({ children, scrollable = true, style }: ScreenContainerProps) {
  const insets = useSafeAreaInsets();

  const containerStyle = [
    styles.container,
    { paddingBottom: insets.bottom + Spacing.lg },
    style,
  ];

  if (scrollable) {
    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={containerStyle}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={[styles.scroll, containerStyle]}>{children}</View>;
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  container: {
    paddingHorizontal: Grid.margin,
    paddingTop: Spacing.sm,
  },
});

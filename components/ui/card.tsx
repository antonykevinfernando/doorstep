import { View, ViewProps, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, Radius, Spacing } from '@/constants/theme';

interface CardProps extends ViewProps {
  intensity?: number;
  padded?: boolean;
}

export function Card({ intensity = 40, padded = true, style, children, ...props }: CardProps) {
  return (
    <View style={[styles.outer, style]} {...props}>
      <BlurView intensity={intensity} tint="light" style={styles.blur}>
        <View style={[styles.inner, padded && styles.padded]}>
          {children}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  blur: {
    overflow: 'hidden',
  },
  inner: {
    backgroundColor: Colors.glass,
  },
  padded: {
    padding: Spacing.lg,
  },
});

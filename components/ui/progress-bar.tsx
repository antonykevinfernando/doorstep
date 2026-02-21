import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

interface ProgressBarProps {
  progress: number;
  height?: number;
  trackColor?: string;
  fillColor?: string;
}

export function ProgressBar({
  progress,
  height = 6,
  trackColor = Colors.overlay,
  fillColor = Colors.green,
}: ProgressBarProps) {
  const clamped = Math.min(1, Math.max(0, progress));

  return (
    <View style={[styles.track, { height, backgroundColor: trackColor, borderRadius: height }]}>
      <View
        style={{
          width: `${clamped * 100}%`,
          height: '100%',
          backgroundColor: fillColor,
          borderRadius: height,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
});

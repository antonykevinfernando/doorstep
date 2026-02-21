import { Pressable, PressableProps, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { Text } from './text';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'default' | 'small';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: Variant;
  size?: Size;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  title,
  variant = 'primary',
  size = 'default',
  icon,
  fullWidth,
  style,
  ...props
}: ButtonProps) {
  const v = variants[variant];
  const isSmall = size === 'small';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        isSmall ? styles.small : styles.default,
        { backgroundColor: v.bg },
        v.border ? { borderWidth: 1, borderColor: v.border } : undefined,
        fullWidth && styles.fullWidth,
        pressed && styles.pressed,
        style as ViewStyle,
      ]}
      {...props}
    >
      {icon}
      <Text
        variant={isSmall ? 'caption' : 'body'}
        semibold
        color={v.text}
        style={icon ? { marginLeft: Spacing.sm } : undefined}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const variants = {
  primary: { bg: Colors.brown, text: Colors.cream, border: undefined },
  secondary: { bg: Colors.glass, text: Colors.brown, border: Colors.glassBorder },
  ghost: { bg: 'transparent', text: Colors.brownMuted, border: undefined },
} as const;

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
  },
  default: {
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
  },
  small: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  fullWidth: {
    width: '100%',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
});

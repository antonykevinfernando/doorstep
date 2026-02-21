import { Text as RNText, TextProps } from 'react-native';
import { Colors, FontFamily, FontSize } from '@/constants/theme';

type Variant = 'hero' | 'title' | 'subtitle' | 'body' | 'caption' | 'label';

interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: string;
  bold?: boolean;
  semibold?: boolean;
  medium?: boolean;
  center?: boolean;
}

const variantStyles: Record<Variant, { fontSize: number; fontWeight: '400' | '500' | '600' | '700'; letterSpacing: number; lineHeight: number }> = {
  hero: { fontSize: FontSize.hero, fontWeight: '700', letterSpacing: -1.5, lineHeight: 62 },
  title: { fontSize: FontSize.xl, fontWeight: '700', letterSpacing: -0.4, lineHeight: 28 },
  subtitle: { fontSize: FontSize.lg, fontWeight: '600', letterSpacing: -0.2, lineHeight: 24 },
  body: { fontSize: FontSize.md, fontWeight: '400', letterSpacing: 0, lineHeight: 22 },
  caption: { fontSize: FontSize.sm, fontWeight: '400', letterSpacing: 0.1, lineHeight: 18 },
  label: { fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.5, lineHeight: 14 },
};

export function Text({
  variant = 'body',
  color = Colors.brown,
  bold,
  semibold,
  medium,
  center,
  style,
  ...props
}: AppTextProps) {
  const v = variantStyles[variant];
  let fontWeight = v.fontWeight;
  if (bold) fontWeight = '700';
  else if (semibold) fontWeight = '600';
  else if (medium) fontWeight = '500';

  return (
    <RNText
      style={[
        {
          fontFamily: FontFamily.regular,
          fontSize: v.fontSize,
          fontWeight,
          color,
          letterSpacing: v.letterSpacing,
          lineHeight: v.lineHeight,
          textAlign: center ? 'center' : undefined,
        },
        style,
      ]}
      {...props}
    />
  );
}

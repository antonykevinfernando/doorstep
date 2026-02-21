import { useEffect } from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Colors, FontFamily } from '@/constants/theme';

const { width } = Dimensions.get('window');
const LOGO_SIZE = width * 0.22;

interface SplashAnimatedProps {
  onFinish: () => void;
}

export function SplashAnimated({ onFinish }: SplashAnimatedProps) {
  const logoScale = useSharedValue(0.6);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(10);
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    logoScale.value = withSequence(
      withSpring(1, { damping: 14, stiffness: 120, mass: 0.8 }),
      withDelay(800, withSpring(0.96, { damping: 20, stiffness: 200 })),
      withSpring(1, { damping: 20, stiffness: 200 }),
    );

    textOpacity.value = withDelay(
      700,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }),
    );
    textTranslateY.value = withDelay(
      700,
      withSpring(0, { damping: 16, stiffness: 140 }),
    );

    containerOpacity.value = withDelay(
      2200,
      withTiming(0, { duration: 400, easing: Easing.in(Easing.cubic) }, () => {
        runOnJS(onFinish)();
      }),
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View style={styles.content}>
        <Animated.View style={logoStyle}>
          <Image
            source={require('@/assets/images/doorstep-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
        <Animated.Text style={[styles.title, textStyle]}>
          doorstep
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.cream,
    zIndex: 100,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    tintColor: Colors.brown,
  },
  title: {
    fontFamily: FontFamily.regular,
    fontSize: 26,
    fontWeight: '600',
    letterSpacing: -0.5,
    color: Colors.brown,
    marginTop: 20,
  },
});

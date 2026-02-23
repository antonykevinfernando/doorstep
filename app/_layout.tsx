import { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SplashAnimated } from '@/components/splash-animated';
import { AuthProvider, useAuth } from '@/context/auth';
import { Colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

function RouteGuard({ children }: { children: React.ReactNode }) {
  const { session, loading, approved } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === 'auth';
    const onPending = segments[0] === 'pending';

    if (!session && !inAuthGroup) {
      router.replace('/auth/login');
    } else if (session && inAuthGroup) {
      if (approved) {
        router.replace('/(tabs)');
      } else {
        router.replace('/pending');
      }
    } else if (session && !onPending && !inAuthGroup && approved === false) {
      router.replace('/pending');
    } else if (session && onPending && approved === true) {
      router.replace('/(tabs)');
    }
  }, [session, loading, approved, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fustat: require('@/assets/fonts/Fustat-Variable.ttf'),
  });
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <View style={styles.root}>
        <RouteGuard>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: Colors.cream },
              headerTintColor: Colors.brown,
              headerTitleStyle: { fontFamily: 'Fustat', fontWeight: '600' },
              contentStyle: { backgroundColor: Colors.cream },
              headerShadowVisible: false,
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="auth/login" options={{ headerShown: false }} />
            <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
            <Stack.Screen name="pending" options={{ headerShown: false }} />
            <Stack.Screen
              name="profile"
              options={{ title: 'Profile', headerBackTitle: 'Home' }}
            />
            <Stack.Screen
              name="messages-screen"
              options={{ title: 'Messages', headerBackTitle: 'Home' }}
            />
            <Stack.Screen
              name="mover/[id]"
              options={{ title: '' }}
            />
          </Stack>
        </RouteGuard>
        {showSplash && <SplashAnimated onFinish={handleSplashFinish} />}
        <StatusBar style="dark" />
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

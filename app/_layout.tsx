import { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SplashAnimated } from '@/components/splash-animated';
import { Colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

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
    <View style={styles.root}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.cream },
          headerTintColor: Colors.brown,
          headerTitleStyle: { fontFamily: 'Fustat', fontWeight: '600' },
          contentStyle: { backgroundColor: Colors.cream },
          headerShadowVisible: false,
          headerBackTitleVisible: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="add-box"
          options={{ presentation: 'modal', title: 'New Box' }}
        />
        <Stack.Screen
          name="mover/[id]"
          options={{ title: '' }}
        />
      </Stack>
      {showSplash && <SplashAnimated onFinish={handleSplashFinish} />}
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

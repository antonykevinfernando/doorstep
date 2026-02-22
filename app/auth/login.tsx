import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors, FontFamily, Spacing, Radius, FontSize } from '@/constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      router.replace('/(tabs)');
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.inner}>
        <Image source={require('@/assets/images/doorstep-logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>doorstep</Text>
        <Text style={styles.subtitle}>Welcome back</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.brownMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={Colors.brownMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Sign in'}</Text>
          </Pressable>
        </View>

        <Link href="/auth/signup" style={styles.link}>
          <Text style={styles.linkText}>Don&apos;t have an account? <Text style={styles.linkBold}>Sign up</Text></Text>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  logo: {
    width: 64,
    height: 64,
    tintColor: Colors.brown,
    marginBottom: Spacing.sm,
  },
  title: {
    fontFamily: FontFamily.regular,
    fontSize: 28,
    fontWeight: '700',
    color: Colors.brown,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: Colors.brownMuted,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xxl,
  },
  form: {
    width: '100%',
    gap: Spacing.md,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: Colors.brown,
  },
  error: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: '#D32F2F',
  },
  button: {
    backgroundColor: Colors.brown,
    borderRadius: Radius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.cream,
  },
  link: {
    marginTop: Spacing.xl,
  },
  linkText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.brownMuted,
  },
  linkBold: {
    fontWeight: '600',
    color: Colors.brown,
  },
});

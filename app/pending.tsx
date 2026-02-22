import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';
import { router } from 'expo-router';
import { Colors, FontFamily, Spacing, Radius, FontSize } from '@/constants/theme';

export default function PendingScreen() {
  const { user, signOut, refreshApproval } = useAuth();
  const [buildingName, setBuildingName] = useState('');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!user) return;

    supabase
      .from('profiles')
      .select('requested_building_id, buildings:buildings!profiles_requested_building_id_fkey(name)')
      .eq('id', user.id)
      .single()
      .then(({ data }: any) => {
        if (data?.buildings?.name) setBuildingName(data.buildings.name);
      });

    const channel = supabase
      .channel('approval')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        async (payload: any) => {
          if (payload.new.approved) {
            await refreshApproval();
          }
        },
      )
      .subscribe();

    // Poll every 10s as fallback (Realtime may not be configured for profiles)
    const poll = setInterval(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('approved')
        .eq('id', user.id)
        .single();
      if (data?.approved) {
        await refreshApproval();
      }
    }, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [user]);

  async function checkStatus() {
    if (!user) return;
    setChecking(true);
    await refreshApproval();
    setChecking(false);
  }

  async function handleSignOut() {
    await signOut();
    router.replace('/auth/login');
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Image
          source={require('@/assets/images/doorstep-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Request sent</Text>
        <Text style={styles.message}>
          {buildingName
            ? `We've sent your move-in request to ${buildingName}. You'll get access once the building team approves it.`
            : `We've sent your request to the building. You'll get access once they've approved it.`}
        </Text>
        <Text style={styles.hint}>This usually takes less than a day.</Text>

        <Pressable style={styles.checkButton} onPress={checkStatus} disabled={checking}>
          {checking ? (
            <ActivityIndicator size="small" color={Colors.brown} />
          ) : (
            <Text style={styles.checkButtonText}>Check status</Text>
          )}
        </Pressable>

        <Pressable onPress={handleSignOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.glass,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: Spacing.xl,
    alignItems: 'center',
    width: '100%',
  },
  logo: {
    width: 56,
    height: 56,
    tintColor: Colors.green,
    marginBottom: Spacing.lg,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.brown,
    marginBottom: Spacing.sm,
  },
  message: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: Colors.brownLight,
    textAlign: 'center',
    lineHeight: 22,
  },
  hint: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.brownMuted,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  checkButton: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.white,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 140,
    alignItems: 'center',
  },
  checkButtonText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.brown,
  },
  signOutButton: {
    marginTop: Spacing.lg,
  },
  signOutText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.brownMuted,
  },
});

import { useState, useRef } from 'react';
import { View, StyleSheet, Pressable, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { ArrowLeft, KeyRound, Minus, Plus, User, MessageSquare, CheckCircle2 } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Colors, Spacing, Radius, Grid, FontFamily, FontSize } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useMove } from '@/hooks/use-move';
import { useAuth } from '@/context/auth';

function Counter({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <View style={styles.counterWrap}>
      <Text variant="caption" color={Colors.brownMuted}>{label}</Text>
      <View style={styles.counterRow}>
        <Pressable
          onPress={() => onChange(Math.max(0, value - 1))}
          style={({ pressed }) => [styles.counterBtn, pressed && { opacity: 0.6 }]}
        >
          <Minus size={16} color={Colors.brown} strokeWidth={2} />
        </Pressable>
        <View style={styles.counterValue}>
          <Text variant="subtitle" color={Colors.brown}>{value}</Text>
        </View>
        <Pressable
          onPress={() => onChange(value + 1)}
          style={({ pressed }) => [styles.counterBtn, pressed && { opacity: 0.6 }]}
        >
          <Plus size={16} color={Colors.brown} strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );
}

export default function KeyFobServiceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { move } = useMove();
  const scrollRef = useRef<ScrollView>(null);

  const [numKeys, setNumKeys] = useState(1);
  const [numFobs, setNumFobs] = useState(1);
  const [pickupPerson, setPickupPerson] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    if (!pickupPerson.trim()) {
      Alert.alert('Required', 'Please enter who will pick up.');
      return;
    }
    if (!move || !user) return;

    setSubmitting(true);
    await supabase.from('messages').insert({
      move_id: move.id,
      sender_id: user.id,
      body: `📋 Service Request: Key / Fob\n${numKeys} key${numKeys !== 1 ? 's' : ''}, ${numFobs} fob${numFobs !== 1 ? 's' : ''}\nPickup: ${pickupPerson.trim()}${reason.trim() ? `\nReason: ${reason.trim()}` : ''}`,
    });
    setSubmitting(false);
    setSuccess(true);
  }

  if (success) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.successWrap}>
          <View style={styles.successIcon}>
            <CheckCircle2 size={48} color={Colors.brown} strokeWidth={1.5} />
          </View>
          <Text variant="title" color={Colors.brown} center>Request Sent</Text>
          <Text variant="body" color={Colors.brownMuted} center style={{ marginTop: Spacing.sm }}>
            Management will follow up in messages.
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.doneBtn, pressed && { opacity: 0.85 }]}
          >
            <Text variant="body" semibold color={Colors.cream}>Done</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const canSubmit = pickupPerson.trim().length > 0 && !submitting;

  return (
    <KeyboardAvoidingView style={[styles.screen, { paddingTop: insets.top + Spacing.sm }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xxl }}
      >
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <BlurView intensity={40} tint="light" style={styles.backBlur}>
            <ArrowLeft size={20} color={Colors.brown} strokeWidth={1.8} />
          </BlurView>
        </Pressable>

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <KeyRound size={24} color={Colors.brown} strokeWidth={1.5} />
          </View>
          <Text variant="title" color={Colors.brown}>Keys & Fobs</Text>
          <Text variant="caption" color={Colors.brownMuted}>Request additional access for your unit</Text>
        </View>

        <View style={styles.counters}>
          <Counter label="KEYS" value={numKeys} onChange={setNumKeys} />
          <Counter label="FOBS" value={numFobs} onChange={setNumFobs} />
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.fieldIcon}>
            <User size={16} color={Colors.brownMuted} strokeWidth={1.8} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="label" color={Colors.brownMuted} style={styles.fieldLabel}>PICKUP PERSON</Text>
            <TextInput
              style={styles.input}
              value={pickupPerson}
              onChangeText={setPickupPerson}
              placeholder="Name of person picking up"
              placeholderTextColor={Colors.brownMuted}
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.fieldIcon}>
            <MessageSquare size={16} color={Colors.brownMuted} strokeWidth={1.8} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="label" color={Colors.brownMuted} style={styles.fieldLabel}>REASON (OPTIONAL)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={reason}
              onChangeText={setReason}
              placeholder="e.g. Lost fob, need replacement"
              placeholderTextColor={Colors.brownMuted}
              multiline
              onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)}
            />
          </View>
        </View>

        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit}
          style={({ pressed }) => [styles.submitBtn, !canSubmit && { opacity: 0.4 }, pressed && { opacity: 0.85 }]}
        >
          <Text variant="body" semibold color={Colors.cream}>Submit Request</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.cream,
    paddingHorizontal: Grid.margin,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
  },
  backBlur: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: 4,
    marginBottom: Spacing.lg,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  counters: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  counterWrap: {
    flex: 1,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.md,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  counterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterValue: {
    width: 40,
    alignItems: 'center',
  },
  fieldGroup: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
    alignItems: 'flex-start',
  },
  fieldIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  fieldLabel: {
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 13,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: Colors.brown,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: Colors.brown,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  successWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  successIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  doneBtn: {
    backgroundColor: Colors.brown,
    borderRadius: Radius.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xxl,
    marginTop: Spacing.xl,
  },
});

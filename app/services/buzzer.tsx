import { useState, useRef } from 'react';
import { View, StyleSheet, Pressable, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { ArrowLeft, BellRing, Phone, User, MessageSquare, CheckCircle2 } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Colors, Spacing, Radius, Grid, FontFamily, FontSize } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useMove } from '@/hooks/use-move';
import { useAuth } from '@/context/auth';

export default function BuzzerServiceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { move } = useMove();
  const scrollRef = useRef<ScrollView>(null);

  const [buzzerName, setBuzzerName] = useState('');
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    if (!buzzerName.trim()) {
      Alert.alert('Required', 'Please enter the buzzer name.');
      return;
    }
    if (!move || !user) return;

    setSubmitting(true);
    await supabase.from('messages').insert({
      move_id: move.id,
      sender_id: user.id,
      body: `📋 Service Request: Buzzer Update\nName: ${buzzerName.trim()}${phone.trim() ? `\nPhone: ${phone.trim()}` : ''}${reason.trim() ? `\nReason: ${reason.trim()}` : ''}`,
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
            Management will update your buzzer and follow up in messages.
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

  const canSubmit = buzzerName.trim().length > 0 && !submitting;

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
            <BellRing size={24} color={Colors.brown} strokeWidth={1.5} />
          </View>
          <Text variant="title" color={Colors.brown}>Buzzer</Text>
          <Text variant="caption" color={Colors.brownMuted}>Update your buzzer details</Text>
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.fieldIcon}>
            <User size={16} color={Colors.brownMuted} strokeWidth={1.8} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="label" color={Colors.brownMuted} style={styles.fieldLabel}>BUZZER NAME</Text>
            <TextInput
              style={styles.input}
              value={buzzerName}
              onChangeText={setBuzzerName}
              placeholder="Name to display on buzzer"
              placeholderTextColor={Colors.brownMuted}
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.fieldIcon}>
            <Phone size={16} color={Colors.brownMuted} strokeWidth={1.8} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="label" color={Colors.brownMuted} style={styles.fieldLabel}>PHONE NUMBER</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Contact number"
              placeholderTextColor={Colors.brownMuted}
              keyboardType="phone-pad"
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
              placeholder="e.g. Name change, adding roommate"
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
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
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

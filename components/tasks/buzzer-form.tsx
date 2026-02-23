import { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { BellRing, Check } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Colors, Spacing, Radius, FontFamily, FontSize } from '@/constants/theme';

interface Props {
  taskId: string;
  response: Record<string, any> | null;
  onSubmit: (taskId: string, response: Record<string, any>) => void;
}

export function BuzzerForm({ taskId, response, onSubmit }: Props) {
  const [buzzerCode, setBuzzerCode] = useState('');
  const [phone, setPhone] = useState('');
  const [editing, setEditing] = useState(false);

  if (response?.buzzer_code && !editing) {
    return (
      <View style={styles.completedWrap}>
        <View style={styles.completedRow}>
          <BellRing size={14} color={Colors.greenDark} strokeWidth={2} />
          <Text variant="caption" color={Colors.brown}>
            Buzzer: {response.buzzer_code}{response.phone ? ` • ${response.phone}` : ''}
          </Text>
          <Check size={14} color={Colors.greenDark} strokeWidth={2.5} />
        </View>
        <Pressable
          style={({ pressed }) => [styles.changeBtn, pressed && { opacity: 0.7 }]}
          onPress={() => { setBuzzerCode(response.buzzer_code); setPhone(response.phone ?? ''); setEditing(true); }}
        >
          <Text variant="caption" medium color={Colors.brownMuted}>Change</Text>
        </Pressable>
      </View>
    );
  }

  const canSubmit = buzzerCode.trim().length > 0;

  return (
    <View style={styles.wrap}>
      <TextInput
        style={styles.input}
        value={buzzerCode}
        onChangeText={setBuzzerCode}
        placeholder="Preferred buzzer name / code"
        placeholderTextColor={Colors.brownMuted}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        placeholder="Contact phone number"
        placeholderTextColor={Colors.brownMuted}
        keyboardType="phone-pad"
      />
      <Pressable
        style={({ pressed }) => [styles.submitBtn, !canSubmit && styles.disabled, pressed && { opacity: 0.7 }]}
        onPress={() => { if (canSubmit) { onSubmit(taskId, { buzzer_code: buzzerCode.trim(), phone: phone.trim() || null }); setEditing(false); } }}
        disabled={!canSubmit}
      >
        <Check size={15} color={Colors.cream} strokeWidth={2.5} />
        <Text variant="caption" medium color={Colors.cream}>{editing ? 'Update' : 'Register Buzzer'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.sm,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.brown,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.brown,
    borderRadius: Radius.sm,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    alignSelf: 'flex-start',
  },
  disabled: {
    opacity: 0.4,
  },
  completedWrap: {
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.greenLight,
    borderRadius: Radius.sm,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
  },
  changeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
});

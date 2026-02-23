import { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { KeyRound, Check } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Colors, Spacing, Radius, FontFamily, FontSize } from '@/constants/theme';

interface Props {
  taskId: string;
  response: Record<string, any> | null;
  onSubmit: (taskId: string, response: Record<string, any>) => void;
}

export function KeyFobForm({ taskId, response, onSubmit }: Props) {
  const [numKeys, setNumKeys] = useState('1');
  const [numFobs, setNumFobs] = useState('1');
  const [pickupPerson, setPickupPerson] = useState('');
  const [editing, setEditing] = useState(false);

  if (response?.num_keys !== undefined && !editing) {
    return (
      <View style={styles.completedWrap}>
        <View style={styles.completedRow}>
          <KeyRound size={14} color={Colors.greenDark} strokeWidth={2} />
          <Text variant="caption" color={Colors.brown}>
            {response.num_keys} key{response.num_keys !== 1 ? 's' : ''}, {response.num_fobs} fob{response.num_fobs !== 1 ? 's' : ''}
            {response.pickup_person ? ` • ${response.pickup_person}` : ''}
          </Text>
          <Check size={14} color={Colors.greenDark} strokeWidth={2.5} />
        </View>
        <Pressable
          style={({ pressed }) => [styles.changeBtn, pressed && { opacity: 0.7 }]}
          onPress={() => {
            setNumKeys(String(response.num_keys ?? 1));
            setNumFobs(String(response.num_fobs ?? 1));
            setPickupPerson(response.pickup_person ?? '');
            setEditing(true);
          }}
        >
          <Text variant="caption" medium color={Colors.brownMuted}>Change</Text>
        </Pressable>
      </View>
    );
  }

  const canSubmit = pickupPerson.trim().length > 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text variant="caption" color={Colors.brownMuted} style={styles.label}>Keys needed</Text>
          <TextInput
            style={styles.input}
            value={numKeys}
            onChangeText={setNumKeys}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={Colors.brownMuted}
          />
        </View>
        <View style={styles.halfField}>
          <Text variant="caption" color={Colors.brownMuted} style={styles.label}>Fobs needed</Text>
          <TextInput
            style={styles.input}
            value={numFobs}
            onChangeText={setNumFobs}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={Colors.brownMuted}
          />
        </View>
      </View>
      <TextInput
        style={styles.input}
        value={pickupPerson}
        onChangeText={setPickupPerson}
        placeholder="Name of person picking up"
        placeholderTextColor={Colors.brownMuted}
      />
      <Pressable
        style={({ pressed }) => [styles.submitBtn, !canSubmit && styles.disabled, pressed && { opacity: 0.7 }]}
        onPress={() => {
          if (canSubmit) {
            onSubmit(taskId, {
              num_keys: parseInt(numKeys) || 0,
              num_fobs: parseInt(numFobs) || 0,
              pickup_person: pickupPerson.trim(),
            });
            setEditing(false);
          }
        }}
        disabled={!canSubmit}
      >
        <Check size={15} color={Colors.cream} strokeWidth={2.5} />
        <Text variant="caption" medium color={Colors.cream}>{editing ? 'Update' : 'Submit'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  halfField: {
    flex: 1,
    gap: 4,
  },
  label: {
    marginLeft: 2,
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

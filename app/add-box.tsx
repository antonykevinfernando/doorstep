import { useState } from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { ScreenContainer } from '@/components/ui/screen-container';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Colors, Spacing, Radius, FontFamily, FontSize } from '@/constants/theme';

const rooms = ['Kitchen', 'Bedroom', 'Bathroom', 'Living Room', 'Office', 'Garage', 'Other'];

export default function AddBoxScreen() {
  const router = useRouter();
  const [label, setLabel] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [itemText, setItemText] = useState('');
  const [items, setItems] = useState<string[]>([]);

  const addItem = () => {
    const trimmed = itemText.trim();
    if (trimmed) {
      setItems((prev) => [...prev, trimmed]);
      setItemText('');
    }
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const canSave = label.trim() && selectedRoom;

  return (
    <ScreenContainer>
      <Text variant="label" color={Colors.brownMuted} style={styles.fieldLabel}>
        BOX LABEL
      </Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Kitchen Essentials"
        placeholderTextColor={Colors.brownMuted}
        value={label}
        onChangeText={setLabel}
      />

      <Text variant="label" color={Colors.brownMuted} style={styles.fieldLabel}>
        ROOM
      </Text>
      <View style={styles.chips}>
        {rooms.map((room) => (
          <Pressable
            key={room}
            onPress={() => setSelectedRoom(room)}
            style={[styles.chip, selectedRoom === room && styles.chipActive]}
          >
            <Text
              variant="caption"
              medium
              color={selectedRoom === room ? Colors.brown : Colors.brownMuted}
            >
              {room}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text variant="label" color={Colors.brownMuted} style={styles.fieldLabel}>
        ITEMS
      </Text>
      <View style={styles.addRow}>
        <TextInput
          style={[styles.input, styles.addInput]}
          placeholder="Add an item..."
          placeholderTextColor={Colors.brownMuted}
          value={itemText}
          onChangeText={setItemText}
          onSubmitEditing={addItem}
          returnKeyType="done"
        />
        <Button title="Add" variant="secondary" size="small" onPress={addItem} />
      </View>

      {items.length > 0 && (
        <View style={styles.itemList}>
          {items.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Text variant="body">{item}</Text>
              <Pressable onPress={() => removeItem(i)} hitSlop={10}>
                <X size={14} color={Colors.brownMuted} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <Button
          title="Save Box"
          fullWidth
          onPress={() => router.back()}
          disabled={!canSave}
          style={!canSave ? { opacity: 0.35 } : undefined}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
    marginLeft: 2,
  },
  input: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: Colors.brown,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  chipActive: {
    backgroundColor: Colors.greenLight,
    borderColor: Colors.greenDark,
  },
  addRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  addInput: {
    flex: 1,
  },
  itemList: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.glass,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  footer: {
    marginTop: Spacing.xxl,
    marginBottom: Spacing.lg,
  },
});

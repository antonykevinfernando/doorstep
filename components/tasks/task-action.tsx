import { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator, Linking } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Upload, Check, FileText as FileIcon, ExternalLink } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Colors, Spacing, Radius, FontFamily, FontSize } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';
import { BuzzerForm } from './buzzer-form';
import { KeyFobForm } from './keyfob-form';
import { ElevatorPicker } from './elevator-picker';
import { DepositAction } from './deposit-action';

interface TaskActionProps {
  taskId: string;
  type: string | null;
  config: Record<string, any> | null;
  response: Record<string, any> | null;
  onSubmit: (taskId: string, response: Record<string, any>) => void;
}

export function TaskAction({ taskId, type, config, response, onSubmit }: TaskActionProps) {
  switch (type) {
    case 'upload_lease':
    case 'upload_insurance':
      return <UploadAction taskId={taskId} response={response} onSubmit={onSubmit} />;
    case 'register_buzzer':
      return <BuzzerForm taskId={taskId} response={response} onSubmit={onSubmit} />;
    case 'key_fob_pickup':
      return <KeyFobForm taskId={taskId} response={response} onSubmit={onSubmit} />;
    case 'schedule_elevator':
      return <ElevatorPicker taskId={taskId} response={response} onSubmit={onSubmit} />;
    case 'pay_deposit':
      return <DepositAction taskId={taskId} config={config} response={response} onSubmit={onSubmit} />;
    default:
      return <ConfirmAction taskId={taskId} response={response} onSubmit={onSubmit} />;
  }
}

/* ── Upload action ── */

function UploadAction({ taskId, response, onSubmit }: Omit<TaskActionProps, 'type' | 'config'>) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const fileName = response?.file_name;

  async function pickAndUpload() {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
    if (result.canceled || !result.assets?.[0]) return;

    const file = result.assets[0];
    setUploading(true);

    try {
      const ext = file.name.split('.').pop() || 'pdf';
      const path = `tasks/${user?.id}/${taskId}.${ext}`;

      const resp = await fetch(file.uri);
      const blob = await resp.blob();

      const { error } = await supabase.storage.from('documents').upload(path, blob, {
        contentType: file.mimeType || 'application/octet-stream',
        upsert: true,
      });

      if (error) {
        Alert.alert('Upload failed', error.message);
        setUploading(false);
        return;
      }

      onSubmit(taskId, { file_path: path, file_name: file.name });
    } catch {
      Alert.alert('Upload failed', 'Something went wrong');
    }
    setUploading(false);
  }

  async function viewFile() {
    if (!response?.file_path) return;
    const { data } = await supabase.storage.from('documents').createSignedUrl(response.file_path, 300);
    if (data?.signedUrl) Linking.openURL(data.signedUrl);
  }

  if (fileName) {
    return (
      <View style={styles.completedWrap}>
        <Pressable onPress={viewFile} style={({ pressed }) => [styles.completedRow, pressed && { opacity: 0.7 }]}>
          <FileIcon size={14} color={Colors.greenDark} strokeWidth={2} />
          <Text variant="caption" color={Colors.brown} style={styles.fileName}>{fileName}</Text>
          <ExternalLink size={12} color={Colors.brownMuted} strokeWidth={2} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.changeBtn, pressed && { opacity: 0.7 }]}
          onPress={pickAndUpload}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color={Colors.brown} />
          ) : (
            <Text variant="caption" medium color={Colors.brownMuted}>Replace file</Text>
          )}
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}
      onPress={pickAndUpload}
      disabled={uploading}
    >
      {uploading ? (
        <ActivityIndicator size="small" color={Colors.brown} />
      ) : (
        <>
          <Upload size={15} color={Colors.brown} strokeWidth={2} />
          <Text variant="caption" medium color={Colors.brown}>Upload file</Text>
        </>
      )}
    </Pressable>
  );
}

/* ── Confirm action (fallback for unrecognized types) ── */

function ConfirmAction({ taskId, response, onSubmit }: Omit<TaskActionProps, 'type' | 'config'>) {
  const [note, setNote] = useState('');
  const [editing, setEditing] = useState(false);

  if (response?.confirmed && !editing) {
    return (
      <View style={styles.completedWrap}>
        <View style={styles.completedRow}>
          <Check size={14} color={Colors.greenDark} strokeWidth={2.5} />
          <Text variant="caption" color={Colors.brown}>
            {response.note ? `Done — ${response.note}` : 'Done'}
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.changeBtn, pressed && { opacity: 0.7 }]}
          onPress={() => { setNote(response.note ?? ''); setEditing(true); }}
        >
          <Text variant="caption" medium color={Colors.brownMuted}>Edit</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.confirmWrap}>
      <TextInput
        style={styles.textInput}
        value={note}
        onChangeText={setNote}
        placeholder="Add a note (optional)"
        placeholderTextColor={Colors.brownMuted}
      />
      <Pressable
        style={({ pressed }) => [styles.confirmBtn, pressed && { opacity: 0.7 }]}
        onPress={() => { onSubmit(taskId, { confirmed: true, note: note.trim() || null }); setEditing(false); }}
      >
        <Check size={15} color={Colors.cream} strokeWidth={2.5} />
        <Text variant="caption" medium color={Colors.cream}>{editing ? 'Update' : 'Mark as done'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.greenLight,
    borderRadius: Radius.sm,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    alignSelf: 'flex-start',
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
  fileName: {
    flex: 1,
    maxWidth: 200,
  },
  textInput: {
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
  confirmWrap: {
    gap: Spacing.sm,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.brown,
    borderRadius: Radius.sm,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    alignSelf: 'flex-start',
  },
});

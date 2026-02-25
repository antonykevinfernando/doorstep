import { useState, useRef, useEffect } from 'react';
import { View, FlatList, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Colors, Spacing, FontFamily, FontSize, Radius } from '@/constants/theme';
import { useMessages, type MessageItem } from '@/hooks/use-messages';

function MessageBubble({ msg, isMe }: { msg: MessageItem; isMe: boolean }) {
  return (
    <View style={[styles.bubbleRow, isMe && styles.bubbleRowMe]}>
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
        {!isMe && msg.sender?.full_name && (
          <Text variant="caption" style={styles.senderName}>{msg.sender.full_name}</Text>
        )}
        <Text variant="body" style={isMe ? styles.textMe : undefined}>{msg.body}</Text>
      </View>
    </View>
  );
}

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { messages, loading, send, currentUserId } = useMessages();
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  async function handleSend() {
    if (!text.trim()) return;
    await send(text);
    setText('');
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + Spacing.md }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.navigate('/')} hitSlop={8} style={({ pressed }) => pressed && { opacity: 0.6 }}>
          <ArrowLeft size={22} color={Colors.brown} strokeWidth={1.8} />
        </Pressable>
        <Text variant="title">Messages</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.brown} style={{ flex: 1 }} />
      ) : messages.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text variant="body" color={Colors.brownMuted} style={styles.empty}>
            No messages yet. Your property team will reach out here.
          </Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => (
            <MessageBubble msg={item} isMe={item.sender_id === currentUserId} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={[styles.inputRow, { paddingBottom: insets.bottom + Spacing.xs }]}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Message..."
          placeholderTextColor={Colors.brownMuted}
          multiline
        />
        <Pressable style={styles.sendBtn} onPress={handleSend} disabled={!text.trim()}>
          <Send size={20} color={text.trim() ? Colors.cream : Colors.brownMuted} strokeWidth={2} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
    paddingHorizontal: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    textAlign: 'center',
  },
  list: {
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  bubbleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  bubbleRowMe: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.xl,
  },
  bubbleMe: {
    backgroundColor: Colors.brown,
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderBottomLeftRadius: 4,
  },
  senderName: {
    marginBottom: 4,
    opacity: 0.5,
  },
  textMe: {
    color: Colors.cream,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.glassBorder,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: Colors.brown,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.brown,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

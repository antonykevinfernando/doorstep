import { useState, useRef, useEffect } from 'react';
import {
  View,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Colors, Spacing, FontFamily, FontSize, Radius } from '@/constants/theme';
import { useMessages, type MessageItem } from '@/hooks/use-messages';
import { useUnread } from '@/hooks/use-unread';
import { useMove } from '@/hooks/use-move';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';

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

export default function MessagesScreenPage() {
  const insets = useSafeAreaInsets();
  const { messages, loading, send, currentUserId } = useMessages();
  const { move } = useMove();
  const { clearUnread } = useUnread(move?.id);
  const { user } = useAuth();
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);
  const [kbHeight, setKbHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKbHeight(e.endCoordinates.height);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKbHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!move || !user) return;
    clearUnread();
    supabase
      .from('message_reads')
      .upsert(
        { user_id: user.id, move_id: move.id, last_read_at: new Date().toISOString() },
        { onConflict: 'user_id,move_id' },
      )
      .then();
  }, [move, user, messages.length]);

  const scrollToBottom = () => {
    listRef.current?.scrollToEnd({ animated: false });
  };

  async function handleSend() {
    if (!text.trim()) return;
    await send(text);
    setText('');
  }

  const bottomPadding = kbHeight > 0 ? kbHeight + Spacing.sm : (insets.bottom || Spacing.sm);

  return (
    <View style={styles.container}>
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
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
        />
      )}

      <View style={[styles.inputRow, { paddingBottom: bottomPadding }]}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
    paddingHorizontal: Spacing.lg,
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
    flex: 1,
  },
  listContent: {
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
    flexGrow: 1,
    justifyContent: 'flex-end',
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

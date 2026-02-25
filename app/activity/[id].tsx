import { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BlurView } from 'expo-blur';
import {
  ArrowLeft,
  ArrowUpDown,
  Truck,
  KeyRound,
  BellRing,
  Phone,
  Send,
  Calendar,
  Clock,
  StickyNote,
} from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Colors, Spacing, Radius, Grid, FontFamily, FontSize } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';
import { useMove } from '@/hooks/use-move';
import type { ActivityItem } from '@/hooks/use-activity';

const statusStyle: Record<string, { bg: string; fg: string }> = {
  booked: { bg: '#E8F5DC', fg: '#5A8A3C' },
  sent: { bg: '#E0F2FE', fg: '#2563EB' },
  pending: { bg: '#FEF3C7', fg: '#92702B' },
  confirmed: { bg: '#E8F5DC', fg: '#5A8A3C' },
  completed: { bg: Colors.overlay, fg: Colors.brownMuted },
  cancelled: { bg: '#FEE2E2', fg: '#DC2626' },
};

function getIcon(item: ActivityItem) {
  if (item.type === 'elevator') return ArrowUpDown;
  if (item.type === 'mover') return Truck;
  if (item.title.includes('Key') || item.title.includes('Fob')) return KeyRound;
  if (item.title.includes('Buzzer')) return BellRing;
  return BellRing;
}

function getHeroBg(item: ActivityItem) {
  if (item.type === 'elevator') return '#E8F5DC';
  if (item.type === 'mover') return '#FEF3C7';
  if (item.title.includes('Key') || item.title.includes('Fob')) return '#FEF3C7';
  return '#E0F2FE';
}

interface ThreadMsg {
  id: string;
  body: string;
  sender_id: string;
  created_at: string;
  sender?: { full_name: string };
}

export default function ActivityDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { move } = useMove();
  const params = useLocalSearchParams<{ id: string; data: string }>();
  const item: ActivityItem | null = params.data ? JSON.parse(params.data) : null;

  const [thread, setThread] = useState<ThreadMsg[]>([]);
  const [threadLoading, setThreadLoading] = useState(true);
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!move) { setThreadLoading(false); return; }

    (async () => {
      const { data } = await supabase
        .from('messages')
        .select('id, body, sender_id, created_at, sender:profiles!messages_sender_id_fkey(full_name)')
        .eq('move_id', move.id)
        .order('created_at', { ascending: true });

      const normalized = (data ?? []).map((m: any) => ({
        ...m,
        sender: Array.isArray(m.sender) ? m.sender[0] : m.sender,
      }));
      setThread(normalized);
      setThreadLoading(false);
    })();

    const channel = supabase
      .channel(`activity-thread-${move.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `move_id=eq.${move.id}` },
        async (payload) => {
          const { data: msg } = await supabase
            .from('messages')
            .select('id, body, sender_id, created_at, sender:profiles!messages_sender_id_fkey(full_name)')
            .eq('id', payload.new.id)
            .single();
          if (msg) {
            const norm = { ...msg, sender: Array.isArray(msg.sender) ? msg.sender[0] : msg.sender } as ThreadMsg;
            setThread((prev) => [...prev, norm]);
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [move]);

  useEffect(() => {
    if (thread.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [thread.length]);

  async function handleSend() {
    if (!text.trim() || !move || !user) return;
    await supabase.from('messages').insert({ move_id: move.id, sender_id: user.id, body: text.trim() });
    setText('');
  }

  if (!item) return null;

  const Icon = getIcon(item);
  const heroBg = getHeroBg(item);
  const st = statusStyle[item.status] ?? statusStyle.sent;

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top + Spacing.sm }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={({ pressed }) => pressed && { opacity: 0.6 }}>
          <BlurView intensity={40} tint="light" style={styles.backBlur}>
            <ArrowLeft size={20} color={Colors.brown} strokeWidth={1.8} />
          </BlurView>
        </Pressable>
        <Text variant="title" color={Colors.brown} numberOfLines={1} style={{ flex: 1 }}>
          {item.title}
        </Text>
      </View>

      {/* Summary card */}
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={[styles.heroIcon, { backgroundColor: heroBg }]}>
            <Icon size={22} color={Colors.brown} strokeWidth={1.5} />
          </View>
          <View style={[styles.statusPill, { backgroundColor: st.bg }]}>
            <Text variant="label" color={st.fg}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.cardDetails}>
          {item.type === 'elevator' && (
            <>
              <DetailRow icon={Calendar} label={item.subtitle.split('·')[0]?.trim()} />
              <DetailRow icon={Clock} label={item.subtitle.split('·')[1]?.trim()} />
            </>
          )}
          {item.type === 'mover' && (
            <>
              <DetailRow icon={Truck} label={item.meta.moverName} />
              <DetailRow icon={Calendar} label={item.subtitle} />
              {item.meta.notes ? <DetailRow icon={StickyNote} label={item.meta.notes} /> : null}
              {item.status === 'confirmed' && item.meta.moverPhone && (
                <Pressable
                  onPress={() => Linking.openURL(`tel:${item.meta.moverPhone}`)}
                  style={({ pressed }) => [styles.callBtn, pressed && { opacity: 0.7 }]}
                >
                  <Phone size={14} color="#fff" strokeWidth={2} />
                  <Text variant="body" medium color="#fff">Call Mover</Text>
                </Pressable>
              )}
            </>
          )}
          {item.type === 'service_request' && (
            <Text variant="caption" color={Colors.brownMuted} style={{ lineHeight: 18 }}>
              {item.meta.body?.split('\n').slice(1).join('\n').trim() || 'Request sent to management'}
            </Text>
          )}
        </View>
      </View>

      {/* Thread */}
      <Text variant="body" medium color={Colors.brown} style={{ marginTop: Spacing.lg, marginBottom: Spacing.sm }}>
        Messages
      </Text>

      {threadLoading ? (
        <ActivityIndicator color={Colors.brown} style={{ flex: 1 }} />
      ) : thread.length === 0 ? (
        <View style={styles.emptyThread}>
          <Text variant="caption" color={Colors.brownMuted} center>
            No messages yet — send one to follow up.
          </Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={thread}
          keyExtractor={(m) => m.id}
          renderItem={({ item: msg }) => {
            const isMe = msg.sender_id === user?.id;
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
          }}
          contentContainerStyle={{ gap: Spacing.sm, paddingBottom: Spacing.md }}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
        />
      )}

      {/* Input */}
      <View style={[styles.inputRow, { paddingBottom: insets.bottom + Spacing.xs }]}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Follow up..."
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

function DetailRow({ icon: IconComp, label }: { icon: any; label?: string }) {
  if (!label) return null;
  return (
    <View style={styles.detailRow}>
      <IconComp size={14} color={Colors.brownMuted} strokeWidth={1.8} />
      <Text variant="body" color={Colors.brownLight}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.cream,
    paddingHorizontal: Grid.margin,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
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
  card: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  cardDetails: {
    gap: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.brown,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
  },
  emptyThread: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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

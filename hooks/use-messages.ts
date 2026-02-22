import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';
import { useMove } from './use-move';

export interface MessageItem {
  id: string;
  body: string;
  sender_id: string;
  created_at: string;
  sender?: { full_name: string };
}

export function useMessages() {
  const { user } = useAuth();
  const { move } = useMove();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!move) { setLoading(false); return; }

    async function fetch() {
      const { data } = await supabase
        .from('messages')
        .select('id, body, sender_id, created_at, sender:profiles!messages_sender_id_fkey(full_name)')
        .eq('move_id', move!.id)
        .order('created_at', { ascending: true });
      const normalized = (data ?? []).map((m: any) => ({
        ...m,
        sender: Array.isArray(m.sender) ? m.sender[0] : m.sender,
      }));
      setMessages(normalized as MessageItem[]);
      setLoading(false);
    }
    fetch();

    const channel = supabase
      .channel(`messages-${move.id}`)
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
            const normalized = { ...msg, sender: Array.isArray(msg.sender) ? msg.sender[0] : msg.sender };
            setMessages((prev) => [...prev, normalized as MessageItem]);
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [move]);

  const send = useCallback(async (body: string) => {
    if (!move || !user) return;
    await supabase.from('messages').insert({
      move_id: move.id,
      sender_id: user.id,
      body: body.trim(),
    });
  }, [move, user]);

  return { messages, loading, send, currentUserId: user?.id ?? '' };
}

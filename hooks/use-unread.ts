import { useEffect, useState, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';

export function useUnread(moveId: string | undefined) {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const moveIdRef = useRef(moveId);
  moveIdRef.current = moveId;

  const fetchCount = useCallback(async () => {
    const mid = moveIdRef.current;
    if (!user || !mid) return;

    const { data: msgs, error: msgsErr } = await supabase
      .from('messages')
      .select('id, created_at')
      .eq('move_id', mid)
      .neq('sender_id', user.id);

    if (msgsErr || !msgs) return;
    if (msgs.length === 0) { setCount(0); return; }

    const { data: readRow } = await supabase
      .from('message_reads')
      .select('last_read_at')
      .eq('user_id', user.id)
      .eq('move_id', mid)
      .maybeSingle();

    if (readRow?.last_read_at) {
      const cutoff = new Date(readRow.last_read_at).getTime();
      setCount(msgs.filter((m) => new Date(m.created_at).getTime() > cutoff).length);
    } else {
      setCount(msgs.length);
    }
  }, [user]);

  useEffect(() => {
    if (!user || !moveId) return;

    fetchCount();

    const channel = supabase
      .channel(`unread-${moveId}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `move_id=eq.${moveId}` },
        (payload) => {
          if (payload.new.sender_id !== user.id) {
            setCount((prev) => prev + 1);
          }
        },
      )
      .subscribe();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') fetchCount();
    });

    return () => {
      supabase.removeChannel(channel);
      sub.remove();
    };
  }, [user, moveId, fetchCount]);

  const clearUnread = useCallback(() => { setCount(0); }, []);

  return { unread: count, clearUnread, refetch: fetchCount };
}

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  moves: any[];
  currentUserId: string;
}

export function MessageThread({ moves, currentUserId }: Props) {
  const [selectedMoveId, setSelectedMoveId] = useState(moves[0]?.id ?? '');
  const [messages, setMessages] = useState<any[]>([]);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabaseRef = useRef(createClient());

  const loadMessages = useCallback(async (moveId: string) => {
    const { data } = await supabaseRef.current
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(full_name)')
      .eq('move_id', moveId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  }, []);

  useEffect(() => {
    if (!selectedMoveId) return;
    const supabase = supabaseRef.current;

    loadMessages(selectedMoveId);

    const channel = supabase
      .channel(`messages-${selectedMoveId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `move_id=eq.${selectedMoveId}` },
        async (payload) => {
          const { data: msg } = await supabase
            .from('messages')
            .select('*, sender:profiles!messages_sender_id_fkey(full_name)')
            .eq('id', payload.new.id)
            .single();
          if (msg) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
          }
        },
      )
      .subscribe();

    function onFocus() { loadMessages(selectedMoveId); }
    window.addEventListener('focus', onFocus);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('focus', onFocus);
    };
  }, [selectedMoveId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    if (!body.trim() || !selectedMoveId) return;
    const text = body.trim();
    setBody('');
    setSending(true);

    const { data } = await supabaseRef.current.from('messages').insert({
      move_id: selectedMoveId,
      sender_id: currentUserId,
      body: text,
    }).select('*, sender:profiles!messages_sender_id_fkey(full_name)').single();

    if (data) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev;
        return [...prev, data];
      });
    }

    setSending(false);
  }

  const selectedMove = moves.find((m: any) => m.id === selectedMoveId);

  return (
    <div className="flex gap-6 h-[calc(100vh-200px)]">
      <div className="w-64 border-r border-black/5 pr-4 overflow-y-auto space-y-1">
        {moves.map((m: any) => (
          <button
            key={m.id}
            onClick={() => setSelectedMoveId(m.id)}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
              m.id === selectedMoveId ? 'bg-black/5 font-medium' : 'hover:bg-black/[0.02]'
            }`}
          >
            <p className="truncate">{m.resident?.full_name || 'Resident'}</p>
            <p className="text-xs text-muted-foreground">
              {m.unit?.building?.name} — {m.unit?.number}
            </p>
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col">
        {selectedMove && (
          <div className="pb-3 mb-3 border-b border-black/5">
            <p className="font-medium">{selectedMove.resident?.full_name}</p>
            <p className="text-xs text-muted-foreground">
              {selectedMove.type?.replace('_', ' ')} — {selectedMove.unit?.building?.name} Unit {selectedMove.unit?.number}
            </p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-3 pb-4">
          {messages.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-12">
              No messages yet. Start the conversation.
            </p>
          )}
          {messages.map((msg: any) => {
            const isMe = msg.sender_id === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                  isMe ? 'bg-[#30261E] text-[#FAF4F3]' : 'bg-white border border-black/5'
                }`}>
                  {!isMe && <p className="text-xs font-medium mb-1 opacity-60">{msg.sender?.full_name}</p>}
                  <p>{msg.body}</p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="flex gap-2 pt-3 border-t border-black/5">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type a message..."
            rows={1}
            className="resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
            }}
          />
          <Button onClick={send} disabled={sending || !body.trim()}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}

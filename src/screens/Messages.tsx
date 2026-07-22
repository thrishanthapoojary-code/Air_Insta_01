import { useEffect, useState } from 'react';
import type { Conversation, Message } from '../types';
import { fetchConversations, fetchMessages, sendMessage, findOrCreateConversation } from '../lib/messaging';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import { timeAgo } from '../lib/utils';
import { Send, Loader2, MessageCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Props = {
  startUserId?: string | null;
  onOpenProfile: (username: string) => void;
};

export default function Messages({ startUserId, onOpenProfile }: Props) {
  const { profile } = useAuth();
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      if (!profile) return;
      setLoading(true);
      try {
        const c = await fetchConversations(profile.id);
        setConvs(c);
        if (startUserId) {
          const id = await findOrCreateConversation(profile, startUserId);
          setActive(id);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [profile, startUserId]);

  useEffect(() => {
    if (!active) return;
    (async () => {
      const m = await fetchMessages(active);
      setMessages(m);
    })();
    const sub = supabase
      .channel(`messages-${active}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${active}` }, () => {
        (async () => setMessages(await fetchMessages(active)))();
      })
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [active]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !active || !text.trim()) return;
    setSending(true);
    const body = text.trim();
    setText('');
    try {
      const m = await sendMessage(active, profile, body);
      setMessages((prev) => [...prev, m]);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-ig-muted" /></div>;

  const activeConv = convs.find((c) => c.id === active);

  return (
    <div className="mx-auto flex h-[calc(100vh-64px)] max-w-5xl overflow-hidden px-0 sm:px-3">
      <aside className={`w-full border-r border-ig-border sm:w-80 ${active ? 'hidden sm:block' : 'block'}`}>
        <div className="border-b border-ig-border p-4">
          <h1 className="text-lg font-bold">Messages</h1>
        </div>
        <div className="overflow-y-auto">
          {convs.length === 0 ? (
            <div className="p-8 text-center text-sm text-ig-muted">
              <MessageCircle size={36} className="mx-auto mb-2 opacity-40" />
              No conversations yet. Message someone from their profile.
            </div>
          ) : (
            convs.map((c) => {
              const other = c.members?.[0];
              return (
                <button
                  key={c.id}
                  onClick={() => setActive(c.id)}
                  className={`flex w-full items-center gap-3 p-3 text-left transition hover:bg-black/[0.03] dark:hover:bg-white/[0.04] ${
                    active === c.id ? 'bg-black/[0.04] dark:bg-white/[0.06]' : ''
                  }`}
                >
                  <Avatar url={other?.avatar_url} name={other?.full_name ?? other?.username} username={other?.username} size={48} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{other?.username ?? c.title ?? 'Chat'}</p>
                    <p className="truncate text-xs text-ig-muted">
                      {c.last_message ?? 'Start chatting'} {c.last_at && `· ${timeAgo(c.last_at)}`}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <section className={`flex-1 ${active ? 'block' : 'hidden sm:block'}`}>
        {!active ? (
          <div className="flex h-full items-center justify-center text-center text-ig-muted">
            <div>
              <MessageCircle size={48} className="mx-auto mb-3 opacity-40" />
              <p>Select a conversation</p>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <header className="flex items-center gap-3 border-b border-ig-border p-3">
              <button className="sm:hidden" onClick={() => setActive(null)}>←</button>
              <Avatar
                url={activeConv?.members?.[0]?.avatar_url}
                name={activeConv?.members?.[0]?.full_name ?? activeConv?.members?.[0]?.username}
                username={activeConv?.members?.[0]?.username}
                size={36}
                onClick={() => activeConv?.members?.[0] && onOpenProfile(activeConv.members[0].username)}
              />
              <button
                className="font-semibold hover:underline"
                onClick={() => activeConv?.members?.[0] && onOpenProfile(activeConv.members[0].username)}
              >
                {activeConv?.members?.[0]?.username ?? 'Chat'}
              </button>
            </header>
            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {messages.map((m) => {
                const mine = m.user_id === profile?.id;
                return (
                  <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-ig-accent text-white' : 'bg-black/[0.06] dark:bg-white/[0.08]'}`}>
                      {m.body}
                      <div className={`mt-0.5 text-[10px] ${mine ? 'text-white/70' : 'text-ig-muted'}`}>{timeAgo(m.created_at)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <form onSubmit={send} className="flex items-center gap-2 border-t border-ig-border p-3">
              <input className="input" placeholder="Message…" value={text} onChange={(e) => setText(e.target.value)} />
              <button type="submit" className="btn-primary" disabled={sending || !text.trim()}>
                <Send size={16} />
              </button>
            </form>
          </div>
        )}
      </section>
    </div>
  );
}

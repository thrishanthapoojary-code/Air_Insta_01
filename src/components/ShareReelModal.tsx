import { useState, useEffect } from 'react';
import { Loader2, Send, Search } from 'lucide-react';
import Modal from './Modal';
import Avatar from './Avatar';
import { useAuth } from '../context/AuthContext';
import { fetchFollowing } from '../lib/profiles';
import { shareReelToDM } from '../lib/reels';
import type { ReelWithAuthor, Profile } from '../types';

type Props = {
  open: boolean;
  onClose: () => void;
  reel: ReelWithAuthor | null;
  onShared?: (conversationId: string) => void;
};

export default function ShareReelModal({ open, onClose, reel, onShared }: Props) {
  const { profile } = useAuth();
  const [following, setFollowing] = useState<Profile[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !profile) return;
    setLoading(true);
    setError(null);
    setSent(null);
    fetchFollowing(profile.id)
      .then((rows) => setFollowing(rows))
      .catch(() => setError('Failed to load contacts'))
      .finally(() => setLoading(false));
  }, [open, profile]);

  const filtered = query
    ? following.filter((f) => f.username.toLowerCase().includes(query.toLowerCase()) || (f.full_name ?? '').toLowerCase().includes(query.toLowerCase()))
    : following;

  const handleSend = async (other: Profile) => {
    if (!profile || !reel) return;
    setSending(other.id);
    setError(null);
    try {
      const convId = await shareReelToDM(profile, other.id, reel);
      setSent(other.id);
      onShared?.(convId);
      setTimeout(() => onClose(), 900);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send');
    } finally {
      setSending(null);
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="flex flex-col">
        <div className="border-b border-ig-border p-4 text-center">
          <h2 className="text-base font-semibold">Share reel</h2>
        </div>
        <div className="p-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-ig-muted" />
            <input
              className="input pl-9"
              placeholder="Search following…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="max-h-72 overflow-y-auto px-2 pb-2">
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-ig-muted" size={24} />
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-ig-muted">No contacts found.</p>
          )}
          {filtered.map((f) => (
            <button
              key={f.id}
              onClick={() => handleSend(f)}
              disabled={!!sending}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50"
            >
              <Avatar url={f.avatar_url} name={f.full_name ?? f.username} username={f.username} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{f.username}</p>
                {f.full_name && <p className="truncate text-xs text-ig-muted">{f.full_name}</p>}
              </div>
              {sent === f.id ? (
                <span className="text-xs font-semibold text-emerald-500">Sent</span>
              ) : sending === f.id ? (
                <Loader2 size={18} className="animate-spin text-ig-muted" />
              ) : (
                <Send size={18} className="text-ig-muted" />
              )}
            </button>
          ))}
        </div>
        {error && <p className="px-4 pb-3 text-sm text-rose-500">{error}</p>}
      </div>
    </Modal>
  );
}

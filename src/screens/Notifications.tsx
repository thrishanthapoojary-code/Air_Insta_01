import { useEffect, useState } from 'react';
import type { Notification } from '../types';
import { fetchNotifications, markNotificationsRead } from '../lib/notifications';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import { timeAgo } from '../lib/utils';
import { Heart, MessageCircle, UserPlus, Bell, Loader2 } from 'lucide-react';

type Props = {
  onOpenProfile: (username: string) => void;
  onOpenPost: (postId: string) => void;
};

const iconFor = (t: string) => {
  if (t === 'like') return <Heart size={16} className="fill-rose-500 text-rose-500" />;
  if (t === 'comment') return <MessageCircle size={16} />;
  if (t === 'follow') return <UserPlus size={16} />;
  return <Bell size={16} />;
};

export default function Notifications({ onOpenProfile, onOpenPost }: Props) {
  const { profile } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!profile) return;
      setLoading(true);
      try {
        const n = await fetchNotifications(profile.id);
        setItems(n);
        await markNotificationsRead(profile.id);
      } finally {
        setLoading(false);
      }
    })();
  }, [profile]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-ig-muted" /></div>;

  return (
    <div className="mx-auto max-w-2xl px-3">
      <h1 className="mb-4 px-1 text-xl font-bold">Notifications</h1>
      {items.length === 0 ? (
        <div className="card p-10 text-center text-ig-muted">
          <Bell size={40} className="mx-auto mb-3 opacity-40" />
          <p>No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {items.map((n) => (
            <div key={n.id} className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition hover:bg-black/[0.03] dark:hover:bg-white/[0.04]">
              <Avatar url={n.actor?.avatar_url} name={n.actor?.username} username={n.actor?.username} size={44} />
              <div className="flex-1 text-sm">
                <button className="font-semibold hover:underline" onClick={() => n.actor && onOpenProfile(n.actor.username)}>
                  {n.actor?.username ?? 'Someone'}
                </button>{' '}
                <span className="text-ig-muted">{n.body?.replace(/^.*?\s/, '')}</span>
                <div className="text-xs text-ig-muted">{timeAgo(n.created_at)} ago</div>
              </div>
              <div className="flex items-center gap-2">
                {n.type === 'follow' && n.actor && (
                  <button className="btn-primary px-3 py-1.5 text-xs" onClick={() => onOpenProfile(n.actor!.username)}>
                    View
                  </button>
                )}
                {n.type === 'like' && n.entity_id && (
                  <button className="text-rose-500" onClick={() => onOpenPost(n.entity_id!)} aria-label="View post">
                    {iconFor(n.type)}
                  </button>
                )}
                {n.type === 'comment' && n.entity_id && (
                  <button onClick={() => onOpenPost(n.entity_id!)} aria-label="View post">{iconFor(n.type)}</button>
                )}
                {n.type !== 'like' && n.type !== 'comment' && n.type !== 'follow' && iconFor(n.type)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

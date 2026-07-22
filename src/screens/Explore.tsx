import { useEffect, useState } from 'react';
import type { PostWithAuthor, Profile } from '../types';
import { fetchExplorePosts } from '../lib/posts';
import { fetchSuggestedUsers, toggleFollow, isFollowing } from '../lib/profiles';
import { useAuth } from '../context/AuthContext';
import { Heart, MessageCircle, Loader2 } from 'lucide-react';
import Avatar from '../components/Avatar';
import { formatCount } from '../lib/utils';

type Props = {
  onOpenProfile: (username: string) => void;
  onOpenPost: (postId: string) => void;
};

export default function Explore({ onOpenProfile, onOpenPost }: Props) {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [suggested, setSuggested] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [followState, setFollowState] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [p, s] = await Promise.all([fetchExplorePosts(), profile ? fetchSuggestedUsers(profile.id) : Promise.resolve([])]);
        setPosts(p);
        setSuggested(s);
        if (profile) {
          const map: Record<string, boolean> = {};
          await Promise.all(s.map(async (u) => (map[u.id] = await isFollowing(profile.id, u.id))));
          setFollowState(map);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [profile]);

  const follow = async (userId: string) => {
    if (!profile) return;
    const cur = followState[userId] ?? false;
    setFollowState((m) => ({ ...m, [userId]: !cur }));
    try {
      await toggleFollow(profile.id, userId, profile);
    } catch {
      setFollowState((m) => ({ ...m, [userId]: cur }));
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-ig-muted" /></div>;

  return (
    <div className="mx-auto max-w-5xl px-3">
      {suggested.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-ig-muted">Suggested for you</h2>
          <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
            {suggested.map((u) => (
              <div key={u.id} className="card flex w-44 shrink-0 flex-col items-center gap-2 p-4 text-center">
                <Avatar url={u.avatar_url} name={u.full_name ?? u.username} username={u.username} size={64} ring />
                <button className="font-semibold hover:underline" onClick={() => onOpenProfile(u.username)}>
                  {u.username}
                </button>
                <p className="line-clamp-2 text-xs text-ig-muted">{u.bio ?? 'No bio yet'}</p>
                <button
                  className={followState[u.id] ? 'btn-outline w-full' : 'btn-primary w-full'}
                  onClick={() => follow(u.id)}
                >
                  {followState[u.id] ? 'Following' : 'Follow'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold text-ig-muted">Trending</h2>
        {posts.length === 0 ? (
          <p className="text-sm text-ig-muted">No posts to explore yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:gap-2">
            {posts.map((p) => (
              <button
                key={p.id}
                onClick={() => onOpenPost(p.id)}
                className="group relative aspect-square overflow-hidden rounded-md bg-black/5"
              >
                {p.media_url ? (
                  <img src={p.media_url} alt="" className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
                ) : (
                  <div className="flex h-full items-center justify-center p-3 text-center text-xs text-ig-muted">{p.caption}</div>
                )}
                <div className="absolute inset-0 flex items-center justify-center gap-4 bg-black/40 opacity-0 transition group-hover:opacity-100">
                  <span className="flex items-center gap-1 font-semibold text-white">
                    <Heart size={18} className="fill-white" /> {formatCount(p.likes_count)}
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-white">
                    <MessageCircle size={18} /> {formatCount(p.comments_count)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

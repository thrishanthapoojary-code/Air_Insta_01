import { useEffect, useState, useCallback } from 'react';
import type { Profile, PostWithAuthor } from '../types';
import { fetchProfileByUsername, toggleFollow, isFollowing, fetchFollowers, fetchFollowing, updateProfile } from '../lib/profiles';
import { fetchProfilePosts } from '../lib/posts';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import Modal from '../components/Modal';
import { Edit2, Grid3x3, Bookmark, Loader2, Settings, ArrowLeft, Send } from 'lucide-react';
import { formatCount } from '../lib/utils';
import { findOrCreateConversation } from '../lib/messaging';

type Props = {
  username: string;
  onBack?: () => void;
  onOpenProfile: (username: string) => void;
  onOpenPost: (postId: string) => void;
  onMessage: (userId: string) => void;
};

export default function Profile({ username, onBack, onOpenProfile, onOpenPost, onMessage }: Props) {
  const { profile: me, refreshProfile } = useAuth();
  const [user, setUser] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [savedPosts] = useState<PostWithAuthor[]>([]);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'posts' | 'saved'>('posts');
  const [editing, setEditing] = useState(false);
  const [followers, setFollowers] = useState<Profile[]>([]);
  const [followingList, setFollowingList] = useState<Profile[]>([]);
  const [showList, setShowList] = useState<'followers' | 'following' | null>(null);

  const load = useCallback(async () => {
    if (!me) return;
    setLoading(true);
    try {
      const u = await fetchProfileByUsername(username);
      setUser(u);
      if (u) {
        const [p, f, fol, folw] = await Promise.all([
          fetchProfilePosts(u.id, me.id),
          isFollowing(me.id, u.id),
          fetchFollowing(u.id),
          fetchFollowers(u.id),
        ]);
        setPosts(p);
        setFollowing(f);
        setFollowingList(fol);
        setFollowers(folw);
      }
    } finally {
      setLoading(false);
    }
  }, [me, username]);

  useEffect(() => { load(); }, [load]);

  const follow = async () => {
    if (!me || !user) return;
    const cur = following;
    setFollowing(!cur);
    try {
      await toggleFollow(me.id, user.id, me);
      const [fol, folw] = await Promise.all([fetchFollowing(user.id), fetchFollowers(user.id)]);
      setFollowingList(fol);
      setFollowers(folw);
    } catch {
      setFollowing(cur);
    }
  };

  const message = async () => {
    if (!me || !user) return;
    await findOrCreateConversation(me, user.id);
    onMessage(user.id);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-ig-muted" /></div>;
  if (!user) return <div className="p-10 text-center text-ig-muted">User not found.</div>;

  const isMe = me?.id === user.id;

  return (
    <div className="mx-auto max-w-3xl px-3 sm:px-4">
      {onBack && (
        <button onClick={onBack} className="mb-2 flex items-center gap-1 text-sm text-ig-muted hover:text-ig-text sm:hidden">
          <ArrowLeft size={18} /> Back
        </button>
      )}
      <header className="flex flex-col gap-6 py-6 sm:flex-row sm:items-center">
        <Avatar url={user.avatar_url} name={user.full_name ?? user.username} username={user.username} size={96} ring className="mx-auto sm:mx-0" />
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
            <h1 className="text-xl font-bold">{user.username}</h1>
            {isMe ? (
              <>
                <button className="btn-outline" onClick={() => setEditing(true)}>
                  <Edit2 size={14} /> Edit profile
                </button>
                <button className="btn-ghost" aria-label="Settings"><Settings size={18} /></button>
              </>
            ) : (
              <>
                <button className={following ? 'btn-outline' : 'btn-primary'} onClick={follow}>
                  {following ? 'Following' : 'Follow'}
                </button>
                <button className="btn-outline" onClick={message}><Send size={14} /> Message</button>
              </>
            )}
          </div>
          <div className="mt-4 flex justify-center gap-8 text-sm sm:justify-start">
            <span><b>{formatCount(user.posts_count)}</b> posts</span>
            <button onClick={() => setShowList('followers')} className="hover:opacity-70">
              <b>{formatCount(user.followers_count)}</b> followers
            </button>
            <button onClick={() => setShowList('following')} className="hover:opacity-70">
              <b>{formatCount(user.following_count)}</b> following
            </button>
          </div>
          <div className="mt-3 text-sm">
            <p className="font-semibold">{user.full_name}</p>
            {user.bio && <p className="whitespace-pre-line text-ig-muted">{user.bio}</p>}
            {user.website && (
              <a href={user.website} target="_blank" rel="noreferrer" className="text-ig-accent hover:underline">
                {user.website}
              </a>
            )}
            {user.location && <p className="text-xs text-ig-muted">📍 {user.location}</p>}
          </div>
        </div>
      </header>

      <div className="flex border-t border-ig-border">
        <button
          onClick={() => setTab('posts')}
          className={`flex flex-1 items-center justify-center gap-2 py-3 text-xs font-semibold tracking-wide ${tab === 'posts' ? 'border-t-2 border-ig-text text-ig-text' : 'text-ig-muted'}`}
        >
          <Grid3x3 size={14} /> POSTS
        </button>
        {isMe && (
          <button
            onClick={() => setTab('saved')}
            className={`flex flex-1 items-center justify-center gap-2 py-3 text-xs font-semibold tracking-wide ${tab === 'saved' ? 'border-t-2 border-ig-text text-ig-text' : 'text-ig-muted'}`}
          >
            <Bookmark size={14} /> SAVED
          </button>
        )}
      </div>

      {tab === 'posts' ? (
        posts.length === 0 ? (
          <p className="py-16 text-center text-sm text-ig-muted">No posts yet.</p>
        ) : (
          <div className="grid grid-cols-3 gap-1 py-2">
            {posts.map((p) => (
              <button key={p.id} onClick={() => onOpenPost(p.id)} className="group relative aspect-square overflow-hidden rounded-md bg-black/5">
                {p.media_url ? (
                  <img src={p.media_url} alt="" className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
                ) : (
                  <div className="flex h-full items-center justify-center p-2 text-center text-[10px] text-ig-muted">{p.caption}</div>
                )}
              </button>
            ))}
          </div>
        )
      ) : (
        savedPosts.length === 0 ? (
          <p className="py-16 text-center text-sm text-ig-muted">Save posts to see them here.</p>
        ) : (
          <div className="grid grid-cols-3 gap-1 py-2">
            {savedPosts.map((p) => (
              <button key={p.id} onClick={() => onOpenPost(p.id)} className="group relative aspect-square overflow-hidden rounded-md">
                <img src={p.media_url ?? ''} alt="" className="h-full w-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        )
      )}

      {editing && me && (
        <EditProfileModal
          profile={me}
          onClose={() => setEditing(false)}
          onSaved={async () => { await refreshProfile(); load(); setEditing(false); }}
        />
      )}

      {showList && (
        <Modal open onClose={() => setShowList(null)} size="sm">
          <div className="p-4">
            <h2 className="mb-3 text-center text-base font-semibold">
              {showList === 'followers' ? 'Followers' : 'Following'}
            </h2>
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {(showList === 'followers' ? followers : followingList).map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setShowList(null); onOpenProfile(p.username); }}
                  className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                >
                  <Avatar url={p.avatar_url} name={p.full_name ?? p.username} username={p.username} size={40} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{p.username}</p>
                    <p className="truncate text-xs text-ig-muted">{p.full_name ?? p.bio ?? ''}</p>
                  </div>
                </button>
              ))}
              {(showList === 'followers' ? followers : followingList).length === 0 && (
                <p className="py-6 text-center text-sm text-ig-muted">No one here yet.</p>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function EditProfileModal({ profile, onClose, onSaved }: { profile: Profile; onClose: () => void; onSaved: () => void }) {
  const [fullName, setFullName] = useState(profile.full_name ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [website, setWebsite] = useState(profile.website ?? '');
  const [location, setLocation] = useState(profile.location ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await updateProfile(profile.id, { full_name: fullName, bio, website, location, avatar_url: avatarUrl || null });
      onSaved();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} size="md">
      <div className="p-5">
        <h2 className="mb-4 text-center text-base font-semibold">Edit profile</h2>
        <div className="flex flex-col items-center gap-2">
          <Avatar url={avatarUrl || undefined} name={fullName || profile.username} username={profile.username} size={80} ring />
          <input className="input mt-2" placeholder="Avatar URL" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
        </div>
        <div className="mt-4 space-y-3">
          <input className="input" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <textarea className="input min-h-[80px] resize-none" placeholder="Bio" value={bio} onChange={(e) => setBio(e.target.value)} />
          <input className="input" placeholder="Website" value={website} onChange={(e) => setWebsite(e.target.value)} />
          <input className="input" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <button onClick={save} className="btn-primary mt-4 w-full" disabled={busy}>
          {busy && <Loader2 size={16} className="animate-spin" />} Save
        </button>
      </div>
    </Modal>
  );
}

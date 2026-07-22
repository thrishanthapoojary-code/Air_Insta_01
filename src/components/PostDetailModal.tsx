import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { fetchComments, addComment, toggleLike } from '../lib/posts';
import { useAuth } from '../context/AuthContext';
import type { PostWithAuthor, Comment } from '../types';
import Modal from './Modal';
import Avatar from './Avatar';
import { Heart, Loader2, Send } from 'lucide-react';
import { timeAgo, cn } from '../lib/utils';

type Props = {
  postId: string | null;
  onClose: () => void;
  onOpenProfile: (username: string) => void;
};

export default function PostDetailModal({ postId, onClose, onOpenProfile }: Props) {
  const { profile } = useAuth();
  const [post, setPost] = useState<PostWithAuthor | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);

  useEffect(() => {
    if (!postId) return;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('posts')
          .select(
            `id, user_id, caption, media_url, media_type, location, hashtags, created_at, updated_at,
             likes_count, comments_count,
             profiles:user_id ( id, username, avatar_url, full_name )`,
          )
          .eq('id', postId)
          .maybeSingle();
        if (error) throw error;
        const p = data as unknown as PostWithAuthor;
        setPost(p);
        setLikes(p?.likes_count ?? 0);
        if (profile && p) {
          const { data: like } = await supabase
            .from('post_likes')
            .select('post_id')
            .match({ post_id: p.id, user_id: profile.id })
            .maybeSingle();
          setLiked(!!like);
        }
        const c = await fetchComments(postId);
        setComments(c);
      } finally {
        setLoading(false);
      }
    })();
  }, [postId, profile]);

  const onLike = async () => {
    if (!profile || !post) return;
    const next = !liked;
    setLiked(next);
    setLikes((c) => c + (next ? 1 : -1));
    try {
      await toggleLike(post.id, !next, profile);
    } catch {
      setLiked(!next);
      setLikes((c) => c + (next ? -1 : 1));
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !post || !text.trim()) return;
    const body = text.trim();
    setText('');
    const c = await addComment(post.id, body, profile);
    setComments((prev) => [...prev, c]);
  };

  return (
    <Modal open={!!postId} onClose={onClose} size="xl">
      {loading || !post ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="animate-spin text-ig-muted" />
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:h-[80vh]">
          <div className="flex items-center justify-center bg-black sm:w-1/2">
            {post.media_url ? (
              <img src={post.media_url} alt="" className="max-h-[50vh] w-full object-contain sm:max-h-[80vh]" />
            ) : (
              <div className="p-8 text-center text-white/70">{post.caption}</div>
            )}
          </div>
          <div className="flex flex-col sm:w-1/2">
            <header className="flex items-center gap-3 border-b border-ig-border p-3">
              <Avatar
                url={post.profiles.avatar_url}
                name={post.profiles.full_name ?? post.profiles.username}
                username={post.profiles.username}
                size={36}
                onClick={() => onOpenProfile(post.profiles.username)}
              />
              <button className="font-semibold hover:underline" onClick={() => onOpenProfile(post.profiles.username)}>
                {post.profiles.username}
              </button>
              {post.location && <span className="ml-auto text-xs text-ig-muted">📍 {post.location}</span>}
            </header>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {post.caption && (
                <div className="text-sm">
                  <button className="mr-2 font-semibold hover:underline" onClick={() => onOpenProfile(post.profiles.username)}>
                    {post.profiles.username}
                  </button>
                  {post.caption}
                </div>
              )}
              {comments.map((c) => (
                <div key={c.id} className="flex gap-2 text-sm">
                  <Avatar url={c.profiles.avatar_url} name={c.profiles.username} size={28} />
                  <div>
                    <span className="mr-2 font-semibold">{c.profiles.username}</span>
                    {c.body}
                    <div className="text-xs text-ig-muted">{timeAgo(c.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-ig-border p-3">
              <div className="mb-2 flex items-center gap-3">
                <button onClick={onLike} className="active:scale-90">
                  <Heart size={22} className={cn(liked ? 'fill-rose-500 text-rose-500' : '')} />
                </button>
                <span className="text-sm font-semibold">{likes} likes</span>
                <span className="ml-auto text-xs text-ig-muted">{timeAgo(post.created_at)} ago</span>
              </div>
              <form onSubmit={submit} className="flex items-center gap-2">
                <input className="input" placeholder="Add a comment…" value={text} onChange={(e) => setText(e.target.value)} />
                <button type="submit" className="btn-primary" disabled={!text.trim()}><Send size={16} /></button>
              </form>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

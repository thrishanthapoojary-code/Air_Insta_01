import { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import type { PostWithAuthor } from '../types';
import { useAuth } from '../context/AuthContext';
import { toggleLike, toggleSave, addComment, fetchComments } from '../lib/posts';
import { formatCount, timeAgo, cn } from '../lib/utils';
import Avatar from './Avatar';
import type { Comment } from '../types';

type Props = {
  post: PostWithAuthor;
  onOpenProfile?: (username: string) => void;
  onOpenPost?: (postId: string) => void;
};

export default function PostCard({ post, onOpenProfile, onOpenPost }: Props) {
  const { profile } = useAuth();
  const [liked, setLiked] = useState(post.liked_by_me ?? false);
  const [likes, setLikes] = useState(post.likes_count);
  const [saved, setSaved] = useState(post.saved_by_me ?? false);
  const [showHeart, setShowHeart] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [posting, setPosting] = useState(false);
  const lastTap = useRef(0);

  useEffect(() => {
    setLiked(post.liked_by_me ?? false);
    setLikes(post.likes_count);
    setSaved(post.saved_by_me ?? false);
  }, [post]);

  const onLike = async () => {
    if (!profile) return;
    const next = !liked;
    setLiked(next);
    setLikes((c) => c + (next ? 1 : -1));
    try {
      await toggleLike(post.id, !next, profile);
    } catch (e) {
      setLiked(!next);
      setLikes((c) => c + (next ? -1 : 1));
    }
  };

  const onDoubleTap = () => {
    if (!liked) onLike();
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);
  };

  const onImageTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) onDoubleTap();
    lastTap.current = now;
  };

  const onSave = async () => {
    if (!profile) return;
    const next = !saved;
    setSaved(next);
    try {
      await toggleSave(post.id, !next, profile.id);
    } catch {
      setSaved(!next);
    }
  };

  const loadComments = async () => {
    const c = await fetchComments(post.id);
    setComments(c);
  };

  const toggleComments = async () => {
    const next = !showComments;
    setShowComments(next);
    if (next && !comments.length) await loadComments();
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !commentText.trim()) return;
    setPosting(true);
    const body = commentText.trim();
    setCommentText('');
    try {
      const c = await addComment(post.id, body, profile);
      setComments((prev) => [...prev, c]);
    } catch {
      setCommentText(body);
    } finally {
      setPosting(false);
    }
  };

  const share = async () => {
    const url = `${window.location.origin}/?post=${post.id}`;
    try {
      if (navigator.share) await navigator.share({ title: 'Air Insta', url });
      else await navigator.clipboard.writeText(url);
    } catch {}
  };

  return (
    <article className="card animate-fade-in overflow-hidden">
      <header className="flex items-center gap-3 p-3">
        <Avatar
          url={post.profiles.avatar_url}
          name={post.profiles.full_name ?? post.profiles.username}
          username={post.profiles.username}
          size={40}
          ring
          onClick={() => onOpenProfile?.(post.profiles.username)}
        />
        <button
          className="flex-1 text-left text-sm font-semibold hover:underline"
          onClick={() => onOpenProfile?.(post.profiles.username)}
        >
          {post.profiles.username}
        </button>
        {post.location && (
          <span className="hidden text-xs text-ig-muted sm:inline">· {post.location}</span>
        )}
        <button className="text-ig-muted hover:text-ig-text" aria-label="More">
          <MoreHorizontal size={20} />
        </button>
      </header>

      <div className="relative select-none bg-black" onClick={onImageTap}>
        {post.media_url ? (
          <img
            src={post.media_url}
            alt={post.caption ?? 'post'}
            className="max-h-[600px] w-full object-contain"
            loading="lazy"
          />
        ) : (
          <div className="flex min-h-[200px] items-center justify-center p-6 text-center text-ig-muted">
            {post.caption}
          </div>
        )}
        {showHeart && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Heart size={96} className="animate-heart-pop fill-white text-white drop-shadow-lg" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 px-3 pt-3">
        <button onClick={onLike} className="p-1.5 transition active:scale-90" aria-label="Like">
          <Heart size={24} className={cn(liked ? 'fill-rose-500 text-rose-500' : 'text-ig-text')} />
        </button>
        <button onClick={toggleComments} className="p-1.5 transition active:scale-90" aria-label="Comment">
          <MessageCircle size={24} />
        </button>
        <button onClick={share} className="p-1.5 transition active:scale-90" aria-label="Share">
          <Send size={24} />
        </button>
        <button onClick={onSave} className="ml-auto p-1.5 transition active:scale-90" aria-label="Save">
          <Bookmark size={24} className={cn(saved ? 'fill-ig-text' : '')} />
        </button>
      </div>

      <div className="px-3 pb-3 text-sm">
        {likes > 0 && <p className="font-semibold">{formatCount(likes)} likes</p>}
        {post.caption && (
          <p className="mt-1 leading-snug">
            <button
              className="mr-2 font-semibold hover:underline"
              onClick={() => onOpenProfile?.(post.profiles.username)}
            >
              {post.profiles.username}
            </button>
            <CaptionWithTags text={post.caption} onTag={() => {}} />
          </p>
        )}
        {post.hashtags && post.hashtags.length > 0 && (
          <p className="mt-1 text-ig-accent">
            {post.hashtags.map((h) => `#${h}`).join(' ')}
          </p>
        )}
        <button className="mt-1 text-ig-muted hover:underline" onClick={() => onOpenPost?.(post.id)}>
          {timeAgo(post.created_at)} ago
        </button>
      </div>

      {showComments && (
        <div className="border-t border-ig-border px-3 py-3">
          <div className="mb-3 max-h-64 space-y-3 overflow-y-auto">
            {comments.length === 0 && <p className="text-sm text-ig-muted">No comments yet.</p>}
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
          <form onSubmit={submitComment} className="flex items-center gap-2">
            <input
              className="input"
              placeholder="Add a comment…"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button type="submit" className="btn-primary" disabled={posting || !commentText.trim()}>
              Post
            </button>
          </form>
        </div>
      )}
    </article>
  );
}

function CaptionWithTags({ text, onTag }: { text: string; onTag: (t: string) => void }) {
  const parts = text.split(/(#[\w]+)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('#') ? (
          <button key={i} className="text-ig-accent hover:underline" onClick={() => onTag(p.slice(1))}>
            {p}
          </button>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

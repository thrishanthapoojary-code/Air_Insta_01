import { useEffect, useRef, useState, useCallback } from 'react';
import { Heart, MessageCircle, Send, Bookmark, Music2, Loader2, Volume2, VolumeX, Plus } from 'lucide-react';
import type { ReelWithAuthor } from '../types';
import { useAuth } from '../context/AuthContext';
import { fetchReels, toggleReelLike } from '../lib/reels';
import { formatCount, cn } from '../lib/utils';
import Avatar from '../components/Avatar';
import CreateReelModal from '../components/CreateReelModal';
import ShareReelModal from '../components/ShareReelModal';

type Props = {
  onOpenProfile: (username: string) => void;
};

export default function Reels({ onOpenProfile }: Props) {
  const { profile } = useAuth();
  const [reels, setReels] = useState<ReelWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [shareReel, setShareReel] = useState<ReelWithAuthor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const loadingMore = useRef(false);

  const load = useCallback(async () => {
    if (!profile || loadingMore.current) return;
    loadingMore.current = true;
    try {
      const { rows, nextCursor, hasMore: hm } = await fetchReels(profile.id, cursor ?? undefined);
      setReels((prev) => [...prev, ...rows]);
      setCursor(nextCursor);
      setHasMore(hm);
    } catch (e: unknown) {
      if (!cursor) setError(e instanceof Error ? e.message : 'Failed to load reels');
    } finally {
      setLoading(false);
      loadingMore.current = false;
    }
  }, [profile, cursor]);

  const reload = useCallback(async () => {
    if (!profile) return;
    setReels([]);
    setCursor(null);
    setHasMore(true);
    setError(null);
    setLoading(true);
    try {
      const { rows, nextCursor, hasMore: hm } = await fetchReels(profile.id);
      setReels(rows);
      setCursor(nextCursor);
      setHasMore(hm);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load reels');
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (profile) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  // Play only the active video, pause all others
  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === activeIndex) {
        v.muted = muted;
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }, [activeIndex, reels, muted]);

  const onScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / el.clientHeight);
    if (idx !== activeIndex) setActiveIndex(idx);

    // Infinite scroll
    if (hasMore && idx >= reels.length - 2) load();
  }, [activeIndex, reels.length, hasMore, load]);

  const toggleLike = async (reel: ReelWithAuthor) => {
    if (!profile) return;
    const liked = reel.liked_by_me ?? false;
    setReels((prev) =>
      prev.map((r) =>
        r.id === reel.id
          ? { ...r, liked_by_me: !liked, likes_count: r.likes_count + (liked ? -1 : 1) }
          : r,
      ),
    );
    try {
      await toggleReelLike(reel.id, liked, profile);
    } catch {
      setReels((prev) =>
        prev.map((r) =>
          r.id === reel.id
            ? { ...r, liked_by_me: liked, likes_count: r.likes_count + (liked ? -1 : 1) }
            : r,
        ),
      );
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center md:h-screen">
        <Loader2 className="animate-spin text-ig-muted" size={32} />
      </div>
    );
  }

  if (error && reels.length === 0) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center md:h-screen">
        <p className="text-sm text-rose-500">{error}</p>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="relative flex h-[calc(100vh-3.5rem)] items-center justify-center bg-black md:h-screen">
        <div className="text-center">
          <p className="text-sm text-white/70">No reels yet.</p>
          <button
            onClick={() => setCreateOpen(true)}
            className="mt-4 flex items-center gap-1.5 rounded-lg bg-ig-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Plus size={16} /> Create reel
          </button>
        </div>
        <CreateReelModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={reload} />
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-3.5rem)] overflow-hidden bg-black md:h-screen">
      {/* Top-right controls */}
      <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
        <button
          onClick={() => setCreateOpen(true)}
          className="rounded-full bg-black/40 p-2 text-white backdrop-blur-sm transition hover:bg-black/60"
          aria-label="Create reel"
        >
          <Plus size={20} />
        </button>
        <button
          onClick={() => setMuted((m) => !m)}
          className="rounded-full bg-black/40 p-2 text-white backdrop-blur-sm transition hover:bg-black/60"
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </div>

      <div
        ref={containerRef}
        onScroll={onScroll}
        className="h-full w-full snap-y snap-mandatory overflow-y-auto scroll-smooth"
      >
        {reels.map((reel, i) => (
          <div key={reel.id} className="relative h-full w-full snap-center snap-always">
            <video
              ref={(el) => (videoRefs.current[i] = el)}
              src={reel.video_url}
              poster={reel.poster_url ?? undefined}
              loop
              playsInline
              muted={muted}
              className="h-full w-full object-cover"
            />
            {/* Gradient overlay for readability */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

            {/* Action buttons */}
            <div className="absolute bottom-20 right-3 z-10 flex flex-col items-center gap-5">
              <button onClick={() => toggleLike(reel)} className="flex flex-col items-center gap-1 transition active:scale-90" aria-label="Like">
                <Heart
                  size={30}
                  className={cn('text-white drop-shadow-lg', reel.liked_by_me && 'fill-rose-500 text-rose-500')}
                />
                <span className="text-xs font-semibold text-white drop-shadow">{formatCount(reel.likes_count)}</span>
              </button>
              <button className="flex flex-col items-center gap-1 transition active:scale-90" aria-label="Comment">
                <MessageCircle size={30} className="text-white drop-shadow-lg" />
                <span className="text-xs font-semibold text-white drop-shadow">{formatCount(reel.comments_count)}</span>
              </button>
              <button onClick={() => setShareReel(reel)} className="flex flex-col items-center gap-1 transition active:scale-90" aria-label="Share">
                <Send size={30} className="text-white drop-shadow-lg" />
              </button>
              <button className="flex flex-col items-center gap-1 transition active:scale-90" aria-label="Save">
                <Bookmark size={30} className="text-white drop-shadow-lg" />
              </button>
            </div>

            {/* Caption + author */}
            <div className="absolute bottom-20 left-3 right-16 z-10">
              <button
                onClick={() => onOpenProfile(reel.profiles.username)}
                className="mb-2 flex items-center gap-2"
              >
                <Avatar url={reel.profiles.avatar_url} name={reel.profiles.full_name ?? reel.profiles.username} username={reel.profiles.username} size={36} ring />
                <span className="font-semibold text-white drop-shadow">{reel.profiles.username}</span>
              </button>
              {reel.caption && (
                <p className="mb-1 text-sm leading-snug text-white drop-shadow">{reel.caption}</p>
              )}
              {reel.hashtags && reel.hashtags.length > 0 && (
                <p className="mb-1 text-sm text-sky-300 drop-shadow">
                  {reel.hashtags.map((h) => `#${h}`).join(' ')}
                </p>
              )}
              {reel.audio_title && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-white/80">
                  <Music2 size={14} className="animate-pulse" />
                  <span className="truncate">{reel.audio_title}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <CreateReelModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={reload} />
      <ShareReelModal open={!!shareReel} onClose={() => setShareReel(null)} reel={shareReel} />
    </div>
  );
}

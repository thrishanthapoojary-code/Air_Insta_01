import { useEffect, useState, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { StoryWithUser } from '../types';
import { useAuth } from '../context/AuthContext';
import { markStoryViewed } from '../lib/stories';
import Avatar from './Avatar';
import { timeAgo } from '../lib/utils';

type Props = {
  groups: { userId: string; user: StoryWithUser['profiles']; items: StoryWithUser[] }[];
  startUserId: string;
  startIndex?: number;
  onClose: () => void;
  onCreate?: () => void;
};

export default function StoryViewer({ groups, startUserId, startIndex = 0, onClose, onCreate }: Props) {
  const { profile } = useAuth();
  const [gIdx, setGIdx] = useState(() => Math.max(0, groups.findIndex((g) => g.userId === startUserId)));
  const [sIdx, setSIdx] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const group = groups[gIdx];
  const story = group?.items[sIdx];

  const next = useCallback(() => {
    if (!group) return;
    if (sIdx < group.items.length - 1) {
      setSIdx((i) => i + 1);
      setProgress(0);
    } else if (gIdx < groups.length - 1) {
      setGIdx((i) => i + 1);
      setSIdx(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [group, sIdx, gIdx, groups.length, onClose]);

  const prev = useCallback(() => {
    if (sIdx > 0) {
      setSIdx((i) => i - 1);
      setProgress(0);
    } else if (gIdx > 0) {
      const prevGroup = groups[gIdx - 1];
      setGIdx((i) => i - 1);
      setSIdx(prevGroup.items.length - 1);
      setProgress(0);
    }
  }, [sIdx, gIdx, groups]);

  useEffect(() => {
    if (story && profile && !story.viewed_by_me) {
      markStoryViewed(story.id, profile.id);
    }
  }, [story, profile]);

  useEffect(() => {
    setProgress(0);
    const start = Date.now();
    const DURATION = 5000;
    const id = setInterval(() => {
      const p = Math.min(100, ((Date.now() - start) / DURATION) * 100);
      setProgress(p);
      if (p >= 100) {
        clearInterval(id);
        next();
      }
    }, 50);
    return () => clearInterval(id);
  }, [story, next]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [next, prev, onClose]);

  if (!group || !story) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black" onClick={onClose}>
        <button className="absolute right-4 top-4 text-white" onClick={onClose}>
          <X size={28} />
        </button>
        <p className="text-white/70">No stories available.</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <button className="absolute right-4 top-4 z-20 text-white hover:opacity-70" onClick={onClose} aria-label="Close">
        <X size={28} />
      </button>
      <button className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full p-2 text-white/80 hover:bg-white/10" onClick={prev} aria-label="Previous">
        <ChevronLeft size={32} />
      </button>
      <button className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full p-2 text-white/80 hover:bg-white/10" onClick={next} aria-label="Next">
        <ChevronRight size={32} />
      </button>

      <div className="relative h-full w-full max-w-md">
        {story.media_url ? (
          <img src={story.media_url} alt="story" className="h-full w-full object-contain" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-white/70">No media</div>
        )}

        {story.caption && (
          <div className="absolute bottom-20 left-0 right-0 px-4 pb-2">
            <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-white backdrop-blur-sm">
              {story.caption}
            </p>
            {story.hashtags && story.hashtags.length > 0 && (
              <p className="mt-1 text-xs text-white/70">
                {story.hashtags.map((t) => `#${t}`).join(' ')}
              </p>
            )}
          </div>
        )}

        <div className="absolute left-0 right-0 top-0 p-3">
          <div className="mb-3 flex gap-1">
            {group.items.map((_, i) => (
              <div key={i} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
                <div className="h-full bg-white transition-all" style={{ width: i < sIdx ? '100%' : i === sIdx ? `${progress}%` : '0%' }} />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Avatar url={group.user.avatar_url} name={group.user.full_name ?? group.user.username} size={36} />
            <div className="text-sm">
              <p className="font-semibold text-white">{group.user.username}</p>
              <p className="text-xs text-white/70">{timeAgo(story.created_at)} ago</p>
            </div>
          </div>
        </div>

        {group.userId === profile?.id && (
          <button
            onClick={onCreate}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-ig-accent px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus size={16} className="mr-1 inline" /> Add to story
          </button>
        )}
      </div>
    </div>
  );
}

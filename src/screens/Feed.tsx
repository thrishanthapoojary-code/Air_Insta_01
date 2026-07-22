import { useCallback, useEffect, useRef, useState } from 'react';
import type { PostWithAuthor, StoryWithUser } from '../types';
import { fetchFeedPage } from '../lib/posts';
import { fetchFeedStories, groupStoriesByUser } from '../lib/stories';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import StoriesBar from '../components/StoriesBar';
import StoryViewer from '../components/StoryViewer';
import { Loader2, AlertCircle } from 'lucide-react';

type Props = {
  onOpenProfile: (username: string) => void;
  onOpenPost: (postId: string) => void;
  onOpenCreate: () => void;
  onOpenStoryCreate: () => void;
  refreshKey: number;
};

export default function Feed({ onOpenProfile, onOpenPost, onOpenCreate, onOpenStoryCreate, refreshKey }: Props) {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [stories, setStories] = useState<StoryWithUser[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [storiesError, setStoriesError] = useState<string | null>(null);
  const [storyOpen, setStoryOpen] = useState<string | null>(null);
  const sentinel = useRef<HTMLDivElement>(null);

  const loadStories = useCallback(async () => {
    if (!profile) return;
    setStoriesLoading(true);
    setStoriesError(null);
    try {
      const s = await fetchFeedStories(profile.id);
      setStories(s);
    } catch (e) {
      setStoriesError(e instanceof Error ? e.message : 'Failed to load stories');
    } finally {
      setStoriesLoading(false);
    }
  }, [profile]);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const { rows, nextCursor, hasMore: hm } = await fetchFeedPage(null, profile.id);
      setPosts(rows);
      setCursor(nextCursor);
      setHasMore(hm);
    } catch (e) {
      console.error('Feed load error:', e);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    load();
    loadStories();
  }, [load, loadStories, refreshKey]);

  const loadMore = useCallback(async () => {
    if (!profile || loadingMore || !hasMore || !cursor) return;
    setLoadingMore(true);
    try {
      const { rows, nextCursor, hasMore: hm } = await fetchFeedPage(cursor, profile.id);
      setPosts((p) => [...p, ...rows]);
      setCursor(nextCursor);
      setHasMore(hm);
    } finally {
      setLoadingMore(false);
    }
  }, [profile, loadingMore, hasMore, cursor]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadMore();
    }, { rootMargin: '600px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  return (
    <div className="mx-auto max-w-[630px] px-0 sm:px-3">
      <div className="card mb-4 px-3 py-2">
        <StoriesBar
          stories={stories}
          onOpenStory={(uid) => setStoryOpen(uid)}
          onCreate={onOpenStoryCreate}
          loading={storiesLoading}
          error={storiesError}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-ig-muted" />
        </div>
      ) : posts.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-10 text-center">
          <p className="text-lg font-semibold">Your feed is empty</p>
          <p className="text-sm text-ig-muted">Follow people or create a post to get started.</p>
          <button className="btn-primary" onClick={onOpenCreate}>Create a post</button>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} onOpenProfile={onOpenProfile} onOpenPost={onOpenPost} />
          ))}
        </div>
      )}

      <div ref={sentinel} className="h-4" />
      {loadingMore && (
        <div className="flex justify-center py-6">
          <Loader2 className="animate-spin text-ig-muted" />
        </div>
      )}

      {storyOpen && (
        <StoryViewer
          groups={groupStoriesByUser(stories)}
          startUserId={storyOpen}
          onClose={() => setStoryOpen(null)}
          onCreate={onOpenStoryCreate}
        />
      )}
    </div>
  );
}

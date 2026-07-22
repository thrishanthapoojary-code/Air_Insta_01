import { Plus, Loader2 } from 'lucide-react';
import type { StoryWithUser } from '../types';
import { groupStoriesByUser } from '../lib/stories';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import { cn } from '../lib/utils';

type Props = {
  stories: StoryWithUser[];
  onOpenStory: (userId: string, index: number) => void;
  onCreate: () => void;
  loading?: boolean;
  error?: string | null;
};

export default function StoriesBar({ stories, onOpenStory, onCreate, loading, error }: Props) {
  const { profile } = useAuth();
  const groups = groupStoriesByUser(stories);

  return (
    <div className="no-scrollbar -mx-3 flex gap-3 overflow-x-auto px-3 py-2 sm:gap-4">
      {profile && (
        <button
          onClick={onCreate}
          className="flex w-16 shrink-0 flex-col items-center gap-1 transition active:scale-95"
          aria-label="Add to your story"
        >
          <div className="relative">
            <Avatar
              url={profile.avatar_url}
              name={profile.full_name ?? profile.username}
              username={profile.username}
              size={64}
            />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-ig-surface bg-ig-accent text-white">
              <Plus size={14} />
            </span>
          </div>
          <span className="max-w-[64px] truncate text-xs">Your story</span>
        </button>
      )}

      {loading ? (
        <div className="flex items-center gap-2 px-2 text-ig-muted">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-xs">Loading stories…</span>
        </div>
      ) : error ? (
        <div className="flex items-center px-2 text-xs text-rose-500">{error}</div>
      ) : (
        groups
          .filter((g) => g.userId !== profile?.id)
          .map((g) => (
            <button
              key={g.userId}
              onClick={() => onOpenStory(g.userId, 0)}
              className="flex w-16 shrink-0 flex-col items-center gap-1 transition active:scale-95"
            >
              <Avatar
                url={g.user.avatar_url}
                name={g.user.full_name ?? g.user.username}
                username={g.user.username}
                size={64}
                ring={!g.allViewed}
                className={cn(g.allViewed && 'opacity-60')}
              />
              <span className="max-w-[64px] truncate text-xs">{g.user.username}</span>
            </button>
          ))
      )}
    </div>
  );
}

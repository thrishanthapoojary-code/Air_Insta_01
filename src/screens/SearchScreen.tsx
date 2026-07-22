import { useEffect, useState } from 'react';
import { searchProfiles, searchHashtags } from '../lib/profiles';
import type { Profile } from '../types';
import Avatar from '../components/Avatar';
import { Search, Hash, Loader2 } from 'lucide-react';
import { debounce } from '../lib/utils';

type Props = {
  onOpenProfile: (username: string) => void;
  onOpenHashtag: (tag: string) => void;
};

export default function SearchScreen({ onOpenProfile, onOpenHashtag }: Props) {
  const [q, setQ] = useState('');
  const [users, setUsers] = useState<Profile[]>([]);
  const [tags, setTags] = useState<{ tag: string; count: number }[]>([]);
  const [loading, setLoading] = useState(false);

  const run = debounce(async (query: string) => {
    if (!query.trim()) {
      setUsers([]);
      setTags([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [u, t] = await Promise.all([searchProfiles(query), searchHashtags(query)]);
      setUsers(u);
      setTags(t);
    } finally {
      setLoading(false);
    }
  }, 250);

  useEffect(() => { run(q); }, [q]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-3 text-ig-muted" />
        <input
          className="input pl-10"
          placeholder="Search users or #hashtags"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />
      </div>

      {loading && <div className="flex justify-center py-8"><Loader2 className="animate-spin text-ig-muted" /></div>}

      {!loading && q.trim() && users.length === 0 && tags.length === 0 && (
        <p className="py-8 text-center text-sm text-ig-muted">No results for "{q}".</p>
      )}

      {tags.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ig-muted">Hashtags</h2>
          <div className="space-y-1">
            {tags.map((t) => (
              <button
                key={t.tag}
                onClick={() => onOpenHashtag(t.tag)}
                className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.05] dark:bg-white/[0.08]">
                  <Hash size={18} />
                </div>
                <div>
                  <p className="font-semibold">#{t.tag}</p>
                  <p className="text-xs text-ig-muted">{t.count} posts</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {users.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ig-muted">Accounts</h2>
          <div className="space-y-1">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => onOpenProfile(u.username)}
                className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
              >
                <Avatar url={u.avatar_url} name={u.full_name ?? u.username} username={u.username} size={44} />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{u.username}</p>
                  <p className="truncate text-xs text-ig-muted">{u.full_name ?? u.bio ?? ''}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

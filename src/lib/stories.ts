import { supabase } from '../lib/supabase';
import type { StoryWithUser, Profile } from '../types';

const STORIES_WINDOW_HOURS = 24;

export async function fetchFeedStories(viewerId: string): Promise<StoryWithUser[]> {
  const since = new Date(Date.now() - STORIES_WINDOW_HOURS * 3600 * 1000).toISOString();
  const { data, error } = await supabase
    .from('stories')
    .select(
      `id, user_id, media_url, media_type, caption, hashtags, created_at,
       profiles:user_id ( id, username, avatar_url, full_name )`,
    )
    .gt('created_at', since)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as unknown as StoryWithUser[];
  const ids = rows.map((r) => r.id);
  let viewed = new Set<string>();
  if (ids.length) {
    const { data: views } = await supabase
      .from('story_views')
      .select('story_id')
      .eq('user_id', viewerId)
      .in('story_id', ids);
    viewed = new Set((views ?? []).map((v) => v.story_id));
  }
  return rows.map((r) => ({ ...r, viewed_by_me: viewed.has(r.id) }));
}

export async function createStory(
  user: Profile,
  media_url: string,
  media_type: string,
  caption?: string,
  hashtags?: string[],
) {
  const { data, error } = await supabase
    .from('stories')
    .insert({
      user_id: user.id,
      media_url,
      media_type,
      caption: caption?.trim() || null,
      hashtags: hashtags?.length ? hashtags : null,
    })
    .select('id, user_id, media_url, media_type, caption, hashtags, created_at')
    .single();
  if (error) throw error;
  return data;
}

export async function markStoryViewed(storyId: string, userId: string) {
  await supabase.from('story_views').upsert({ story_id: storyId, user_id: userId }, { onConflict: 'story_id,user_id' });
}

export function groupStoriesByUser(stories: StoryWithUser[]) {
  const map = new Map<string, StoryWithUser[]>();
  for (const s of stories) {
    const arr = map.get(s.user_id) ?? [];
    arr.push(s);
    map.set(s.user_id, arr);
  }
  return Array.from(map.entries()).map(([userId, items]) => ({
    userId,
    user: items[0].profiles,
    items: items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    allViewed: items.every((i) => i.viewed_by_me),
  }));
}

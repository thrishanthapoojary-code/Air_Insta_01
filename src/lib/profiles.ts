import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

export async function fetchProfileByUsername(username: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username.toLowerCase())
    .maybeSingle();
  if (error) throw error;
  return (data as Profile) ?? null;
}

export async function fetchProfileById(id: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as Profile) ?? null;
}

export async function updateProfile(id: string, patch: Partial<Profile>) {
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: patch.full_name,
      bio: patch.bio,
      avatar_url: patch.avatar_url,
      website: patch.website,
      location: patch.location,
    })
    .eq('id', id);
  if (error) throw error;
}

export async function isFollowing(followerId: string, followeeId: string): Promise<boolean> {
  const { data } = await supabase
    .from('follows')
    .select('follower_id')
    .match({ follower_id: followerId, followee_id: followeeId })
    .maybeSingle();
  return !!data;
}

export async function toggleFollow(followerId: string, followeeId: string, follower: Profile) {
  const following = await isFollowing(followerId, followeeId);
  if (following) {
    const { error } = await supabase
      .from('follows')
      .delete()
      .match({ follower_id: followerId, followee_id: followeeId });
    if (error) throw error;
    return { following: false };
  }
  const { error } = await supabase.from('follows').insert({ follower_id: followerId, followee_id: followeeId });
  if (error) throw error;
  if (followeeId !== followerId) {
    await supabase.from('notifications').insert({
      user_id: followeeId,
      actor_id: followerId,
      type: 'follow',
      body: `${follower.username} started following you.`,
    });
  }
  return { following: true };
}

export async function fetchFollowers(userId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id, profiles:follower_id ( id, username, full_name, avatar_url, bio )')
    .eq('followee_id', userId);
  if (error) throw error;
  return ((data ?? []) as unknown as { profiles: Profile }[]).map((r) => r.profiles);
}

export async function fetchFollowing(userId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('followee_id, profiles:followee_id ( id, username, full_name, avatar_url, bio )')
    .eq('follower_id', userId);
  if (error) throw error;
  return ((data ?? []) as unknown as { profiles: Profile }[]).map((r) => r.profiles);
}

export async function searchProfiles(query: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, bio')
    .ilike('username', `%${query}%`)
    .limit(20);
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function searchHashtags(query: string): Promise<{ tag: string; count: number }[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('hashtags')
    .ilike('hashtags', `%${query}%`)
    .limit(200);
  if (error) throw error;
  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    for (const tag of (row.hashtags as string[]) ?? []) {
      if (tag.includes(query.toLowerCase())) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
}

export async function fetchSuggestedUsers(viewerId: string): Promise<Profile[]> {
  const { data: following } = await supabase
    .from('follows')
    .select('followee_id')
    .eq('follower_id', viewerId);
  const ids = (following ?? []).map((f) => f.followee_id);
  ids.push(viewerId);
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, bio')
    .not('id', 'in', `(${ids.map((i) => `'${i}'`).join(',')})`)
    .limit(5);
  if (error) throw error;
  return (data ?? []) as Profile[];
}

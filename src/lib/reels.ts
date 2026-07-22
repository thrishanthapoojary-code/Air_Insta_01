import { supabase } from './supabase';
import { findOrCreateConversation, sendMessage } from './messaging';
import type { ReelWithAuthor, Profile } from '../types';

const PAGE = 6;

export async function fetchReels(viewerId: string, cursor?: string): Promise<{ rows: ReelWithAuthor[]; nextCursor: string | null; hasMore: boolean }> {
  let q = supabase
    .from('reels')
    .select(
      `id, user_id, video_url, poster_url, caption, hashtags, audio_title,
       likes_count, comments_count, created_at, updated_at,
       profiles:user_id ( id, username, avatar_url, full_name )`,
    )
    .order('created_at', { ascending: false })
    .limit(PAGE + 1);

  if (cursor) q = q.lt('created_at', cursor);

  const { data, error } = await q;
  if (error) throw error;

  const rows = (data ?? []) as unknown as ReelWithAuthor[];
  const hasMore = rows.length > PAGE;
  const slice = hasMore ? rows.slice(0, PAGE) : rows;
  const nextCursor = hasMore ? slice[slice.length - 1].created_at : null;

  const ids = slice.map((r) => r.id);
  if (ids.length) {
    const { data: likes } = await supabase
      .from('reel_likes')
      .select('reel_id')
      .eq('user_id', viewerId)
      .in('reel_id', ids);
    const liked = new Set((likes ?? []).map((l) => l.reel_id));
    slice.forEach((r) => (r.liked_by_me = liked.has(r.id)));
  }

  return { rows: slice, nextCursor, hasMore };
}

export async function toggleReelLike(reelId: string, unlike: boolean, profile: Profile) {
  if (unlike) {
    const { error } = await supabase.from('reel_likes').delete().eq('reel_id', reelId).eq('user_id', profile.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('reel_likes').insert({ reel_id: reelId, user_id: profile.id });
    if (error) throw error;
  }
}

export async function createReel(
  profile: Profile,
  videoUrl: string,
  posterUrl: string | null,
  caption: string,
  hashtags: string[],
  audioTitle: string | null,
) {
  const { data, error } = await supabase
    .from('reels')
    .insert({
      user_id: profile.id,
      video_url: videoUrl,
      poster_url: posterUrl,
      caption: caption || null,
      hashtags: hashtags.length ? hashtags : null,
      audio_title: audioTitle,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function shareReelToDM(
  profile: Profile,
  otherUserId: string,
  reel: ReelWithAuthor,
): Promise<string> {
  const body = `${reel.profiles.username} shared a reel: ${reel.video_url}`;
  const convId = await findOrCreateConversation(profile, otherUserId);
  await sendMessage(convId, profile, body);
  return convId;
}

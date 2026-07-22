import { supabase } from '../lib/supabase';
import type { PostWithAuthor, Profile } from '../types';

const PAGE = 8;

export async function fetchFeedPage(cursor: string | null, viewerId: string) {
  let q = supabase
    .from('posts')
    .select(
      `id, user_id, caption, media_url, media_type, location, hashtags, created_at, updated_at,
       likes_count, comments_count,
       profiles:user_id ( id, username, avatar_url, full_name )`,
    )
    .order('created_at', { ascending: false })
    .limit(PAGE + 1);
  if (cursor) q = q.lt('created_at', cursor);

  const { data, error } = await q;
  if (error) throw error;
  const rows = (data ?? []) as unknown as PostWithAuthor[];
  const hasMore = rows.length > PAGE;
  const page = hasMore ? rows.slice(0, PAGE) : rows;
  const nextCursor = page.length ? page[page.length - 1].created_at : null;

  const postIds = page.map((p) => p.id);
  let likedMap: Record<string, boolean> = {};
  let savedMap: Record<string, boolean> = {};
  if (postIds.length) {
    const [likes, saves] = await Promise.all([
      supabase.from('post_likes').select('post_id').eq('user_id', viewerId).in('post_id', postIds),
      supabase.from('saved_posts').select('post_id').eq('user_id', viewerId).in('post_id', postIds),
    ]);
    likedMap = Object.fromEntries((likes.data ?? []).map((l) => [l.post_id, true]));
    savedMap = Object.fromEntries((saves.data ?? []).map((s) => [s.post_id, true]));
  }
  const withFlags = page.map((p) => ({
    ...p,
    liked_by_me: !!likedMap[p.id],
    saved_by_me: !!savedMap[p.id],
  }));
  return { rows: withFlags, nextCursor, hasMore };
}

export async function fetchProfilePosts(userId: string, viewerId: string) {
  const { data, error } = await supabase
    .from('posts')
    .select(
      `id, user_id, caption, media_url, media_type, location, hashtags, created_at, updated_at,
       likes_count, comments_count,
       profiles:user_id ( id, username, avatar_url, full_name )`,
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as unknown as PostWithAuthor[];
  const postIds = rows.map((p) => p.id);
  let likedMap: Record<string, boolean> = {};
  let savedMap: Record<string, boolean> = {};
  if (postIds.length) {
    const [likes, saves] = await Promise.all([
      supabase.from('post_likes').select('post_id').eq('user_id', viewerId).in('post_id', postIds),
      supabase.from('saved_posts').select('post_id').eq('user_id', viewerId).in('post_id', postIds),
    ]);
    likedMap = Object.fromEntries((likes.data ?? []).map((l) => [l.post_id, true]));
    savedMap = Object.fromEntries((saves.data ?? []).map((s) => [s.post_id, true]));
  }
  return rows.map((p) => ({
    ...p,
    liked_by_me: !!likedMap[p.id],
    saved_by_me: !!savedMap[p.id],
  }));
}

export async function fetchExplorePosts() {
  const { data, error } = await supabase
    .from('posts')
    .select(
      `id, user_id, caption, media_url, media_type, location, hashtags, created_at, updated_at,
       likes_count, comments_count,
       profiles:user_id ( id, username, avatar_url, full_name )`,
    )
    .order('likes_count', { ascending: false })
    .limit(30);
  if (error) throw error;
  return (data ?? []) as unknown as PostWithAuthor[];
}

export async function toggleLike(postId: string, liked: boolean, actor: Profile) {
  if (liked) {
    const { error } = await supabase.from('post_likes').delete().match({ post_id: postId, user_id: actor.id });
    if (error) throw error;
  } else {
    const { error } = await supabase.from('post_likes').insert({ post_id: postId, user_id: actor.id });
    if (error) throw error;
    const { data: post } = await supabase.from('posts').select('user_id').eq('id', postId).maybeSingle();
    if (post && post.user_id !== actor.id) {
      await supabase.from('notifications').insert({
        user_id: post.user_id,
        actor_id: actor.id,
        type: 'like',
        entity_id: postId,
        body: `${actor.username} liked your post.`,
      });
    }
  }
}

export async function toggleSave(postId: string, saved: boolean, userId: string) {
  if (saved) {
    const { error } = await supabase.from('saved_posts').delete().match({ post_id: postId, user_id: userId });
    if (error) throw error;
  } else {
    const { error } = await supabase.from('saved_posts').insert({ post_id: postId, user_id: userId });
    if (error) throw error;
  }
}

export async function addComment(postId: string, body: string, actor: Profile) {
  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id: postId, user_id: actor.id, body })
    .select('id, post_id, user_id, parent_id, body, created_at')
    .single();
  if (error) throw error;
  const { data: post } = await supabase.from('posts').select('user_id').eq('id', postId).maybeSingle();
  if (post && post.user_id !== actor.id) {
    await supabase.from('notifications').insert({
      user_id: post.user_id,
      actor_id: actor.id,
      type: 'comment',
      entity_id: postId,
      body: `${actor.username} commented: "${body.slice(0, 40)}"`,
    });
  }
  return { ...data, profiles: { id: actor.id, username: actor.username, avatar_url: actor.avatar_url } };
}

export async function fetchComments(postId: string) {
  const { data, error } = await supabase
    .from('comments')
    .select('id, post_id, user_id, parent_id, body, created_at, profiles:user_id ( id, username, avatar_url )')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as import('../types').Comment[];
}

export async function createPost(input: {
  user_id: string;
  caption: string;
  media_url: string;
  media_type: string;
  location?: string;
}) {
  const hashtags = input.caption.match(/#(\w+)/g)?.map((m) => m.slice(1).toLowerCase()) ?? [];
  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: input.user_id,
      caption: input.caption,
      media_url: input.media_url,
      media_type: input.media_type,
      location: input.location || null,
      hashtags,
    })
    .select('id, user_id, caption, media_url, media_type, location, hashtags, created_at, updated_at, likes_count, comments_count')
    .single();
  if (error) throw error;
  return data;
}

export async function deletePost(postId: string, userId: string) {
  const { error } = await supabase.from('posts').delete().match({ id: postId, user_id: userId });
  if (error) throw error;
}

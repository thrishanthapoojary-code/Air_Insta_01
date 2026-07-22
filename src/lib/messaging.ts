import { supabase } from '../lib/supabase';
import type { Conversation, Message, Profile } from '../types';

export async function fetchConversations(userId: string): Promise<Conversation[]> {
  const { data: members, error } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', userId);
  if (error) throw error;
  const ids = (members ?? []).map((m) => m.conversation_id);
  if (!ids.length) return [];

  const { data: convs } = await supabase
    .from('conversations')
    .select('id, title, is_group, created_at')
    .in('id', ids)
    .order('created_at', { ascending: false });

  const { data: allMembers } = await supabase
    .from('conversation_members')
    .select('conversation_id, user_id, profiles:user_id ( id, username, avatar_url, full_name )')
    .in('conversation_id', ids);

  const { data: lastMsgs } = await supabase
    .from('messages')
    .select('conversation_id, body, created_at')
    .in('conversation_id', ids)
    .order('created_at', { ascending: false })
    .limit(200);

  const lastByConv = new Map<string, { body: string; created_at: string }>();
  for (const m of lastMsgs ?? []) {
    if (!lastByConv.has(m.conversation_id)) lastByConv.set(m.conversation_id, { body: m.body, created_at: m.created_at });
  }

  type MemberLite = { id: string; username: string; avatar_url: string | null; full_name: string | null };
  const membersByConv = new Map<string, MemberLite[]>();
  for (const m of allMembers ?? []) {
    const arr = membersByConv.get(m.conversation_id) ?? [];
    arr.push(m.profiles as unknown as MemberLite);
    membersByConv.set(m.conversation_id, arr);
  }

  return (convs ?? [])
    .map((c) => {
      const last = lastByConv.get(c.id);
      const members = (membersByConv.get(c.id) ?? []).filter((m) => m.id !== userId);
      return {
        id: c.id,
        title: c.title,
        is_group: c.is_group,
        created_at: c.created_at,
        last_message: last?.body,
        last_at: last?.created_at,
        members,
      } as Conversation;
    })
    .sort((a, b) => (b.last_at ?? b.created_at).localeCompare(a.last_at ?? a.created_at));
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, conversation_id, user_id, body, created_at, profiles:user_id ( id, username, avatar_url )')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as unknown as Message[];
}

export async function sendMessage(conversationId: string, user: Profile, body: string) {
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, user_id: user.id, body })
    .select('id, conversation_id, user_id, body, created_at, profiles:user_id ( id, username, avatar_url )')
    .single();
  if (error) throw error;
  return data as unknown as Message;
}

export async function findOrCreateConversation(user: Profile, otherUserId: string): Promise<string> {
  const { data: myMembers } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', user.id);
  const myConvIds = (myMembers ?? []).map((m) => m.conversation_id);
  if (myConvIds.length) {
    const { data: shared } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', otherUserId)
      .in('conversation_id', myConvIds);
    if (shared && shared.length) {
      for (const s of shared) {
        const { data: members } = await supabase
          .from('conversation_members')
          .select('user_id')
          .eq('conversation_id', s.conversation_id);
        if (members && members.length === 2) return s.conversation_id;
      }
    }
  }
  const { data: conv, error } = await supabase
    .from('conversations')
    .insert({ is_group: false })
    .select('id')
    .single();
  if (error || !conv) throw error ?? new Error('Failed to create conversation');
  await supabase.from('conversation_members').insert([
    { conversation_id: conv.id, user_id: user.id },
    { conversation_id: conv.id, user_id: otherUserId },
  ]);
  return conv.id;
}

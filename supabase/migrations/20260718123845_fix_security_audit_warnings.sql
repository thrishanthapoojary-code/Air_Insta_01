/*
# Fix security audit warnings

1. Function search_path mutability
   Five trigger functions were declared without a fixed `search_path`, which
   Supabase's security audit flags as "Function Search Path Mutable". An
   attacker-controlled search_path could let a malicious schema shadow
   `public.*` tables. We pin `search_path = public` on each function so the
   resolved tables are always the public ones.

2. conversations INSERT policy always true
   The `conversations_insert_member` policy used `WITH CHECK (true)`, meaning
   any authenticated user could insert any conversation row with no ownership
   check. We add a `created_by` column (defaulting to auth.uid()) and replace
   the policy with `WITH CHECK (auth.uid() = created_by)`, so only the creator
   can insert a conversation. The existing frontend insert omits `created_by`
   and relies on the DEFAULT auth.uid(), so no app change is needed.

3. Tables modified
   - conversations: added `created_by uuid NOT NULL DEFAULT auth.uid()`.

4. Security changes
   - ALTER FUNCTION ... SET search_path = public on 5 functions.
   - Replaced conversations INSERT policy with an owner-scoped check.
*/

-- ---------- pin search_path on trigger functions ----------
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.sync_post_likes_count() SET search_path = public;
ALTER FUNCTION public.sync_post_comments_count() SET search_path = public;
ALTER FUNCTION public.sync_follow_counts() SET search_path = public;
ALTER FUNCTION public.sync_profile_posts_count() SET search_path = public;

-- ---------- conversations: owner-scoped INSERT ----------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.conversations
      ADD COLUMN created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

DROP POLICY IF EXISTS "conversations_insert_member" ON public.conversations;
CREATE POLICY "conversations_insert_own" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "conversations_update_member" ON public.conversations;
CREATE POLICY "conversations_update_member" ON public.conversations
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.conversation_members cm WHERE cm.conversation_id = id AND cm.user_id = auth.uid())
  );

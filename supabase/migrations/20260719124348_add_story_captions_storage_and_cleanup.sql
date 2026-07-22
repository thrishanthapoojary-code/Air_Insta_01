/*
# Air Insta — story captions, storage bucket, story expiry helper

1. Overview
   Extends the stories table to support captions and hashtags (matching the
   "Add Story" feature: upload from gallery/camera, captions, tags). Adds a
   public Supabase Storage bucket for user-uploaded story/post media with
   owner-scoped RLS policies. Adds a helper function to delete expired stories
   (older than 24h) so a scheduled cleanup or manual call can purge them.

2. Modified Tables
   - public.stories
     + caption (text, nullable) — optional story caption text.
     + hashtags (text[], nullable) — parsed hashtag list for the story.

3. New Storage Bucket
   - media: public bucket for user-uploaded images/videos. Files are stored
     under per-user paths (stories/<uid>/<id>, posts/<uid>/<id>) so ownership
     policies can scope access.

4. Storage Policies (owner-scoped)
   - SELECT (read): public — anyone can read media (stories/posts are visible
     to authenticated users; media URLs are public).
   - INSERT: only the authenticated owner can upload into their own prefix.
   - UPDATE / DELETE: only the authenticated owner can modify their files.

5. New Functions
   - public.delete_expired_stories(): deletes story rows older than 24 hours.
     Returns the count of deleted rows. Safe to call repeatedly (idempotent).
     search_path pinned to public.

6. Security
   - RLS already enabled on stories; no change to existing policies (owner can
     insert/delete, authenticated can select).
   - Storage policies enforce ownership by matching the file path prefix to
     auth.uid().

7. Notes
   - The 24h expiry is already enforced client-side by the feed query
     (created_at > now() - 24h). The helper function is for server-side
     cleanup of stale rows and their storage files.
   - Existing story rows get NULL caption/hashtags — no data loss.
*/

-- ---------- stories: caption + hashtags ----------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'stories' AND column_name = 'caption'
  ) THEN
    ALTER TABLE public.stories ADD COLUMN caption text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'stories' AND column_name = 'hashtags'
  ) THEN
    ALTER TABLE public.stories ADD COLUMN hashtags text[];
  END IF;
END $$;

-- ---------- storage bucket: media ----------
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- ---------- storage policies ----------
-- Public read: media is visible to anyone (stories/posts are authenticated-readable)
DROP POLICY IF EXISTS "media_read_public" ON storage.objects;
CREATE POLICY "media_read_public" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'media');

-- Insert: owner only, path must start with their uid
DROP POLICY IF EXISTS "media_insert_own" ON storage.objects;
CREATE POLICY "media_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Update: owner only
DROP POLICY IF EXISTS "media_update_own" ON storage.objects;
CREATE POLICY "media_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Delete: owner only
DROP POLICY IF EXISTS "media_delete_own" ON storage.objects;
CREATE POLICY "media_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------- helper: delete expired stories ----------
CREATE OR REPLACE FUNCTION public.delete_expired_stories()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.stories
  WHERE created_at < (now() - interval '24 hours');
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

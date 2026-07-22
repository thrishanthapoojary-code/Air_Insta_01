/*
# Create reels table

1. Overview
   Adds a Reels feature to Air Insta — short vertical videos with captions,
   likes, and comments. Mirrors the posts model but for video content
   consumed in a vertical swipe feed.

2. New Tables
   - reels: short videos with caption, hashtags, audio title, and counter columns.
   - reel_likes: one like per (user, reel).

3. Security
   - RLS enabled on both tables.
   - Reels readable by all authenticated users; writable only by owner.
   - Reel likes readable by all; insertable/deletable by the actor.

4. Notes
   - likes_count maintained by trigger on reel_likes.
   - user_id defaults to auth.uid() so client inserts omitting the owner succeed.
*/

CREATE TABLE IF NOT EXISTS public.reels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_url text NOT NULL,
  poster_url text,
  caption text,
  hashtags text[],
  audio_title text,
  likes_count integer NOT NULL DEFAULT 0,
  comments_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reels_select_authenticated" ON public.reels;
CREATE POLICY "reels_select_authenticated" ON public.reels
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "reels_insert_own" ON public.reels;
CREATE POLICY "reels_insert_own" ON public.reels
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "reels_update_own" ON public.reels;
CREATE POLICY "reels_update_own" ON public.reels
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "reels_delete_own" ON public.reels;
CREATE POLICY "reels_delete_own" ON public.reels
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER reels_set_updated_at BEFORE UPDATE ON public.reels
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX IF NOT EXISTS reels_created_at_idx ON public.reels(created_at DESC);
CREATE INDEX IF NOT EXISTS reels_user_id_idx ON public.reels(user_id);

CREATE TABLE IF NOT EXISTS public.reel_likes (
  reel_id uuid NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (reel_id, user_id)
);
ALTER TABLE public.reel_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reel_likes_select_authenticated" ON public.reel_likes;
CREATE POLICY "reel_likes_select_authenticated" ON public.reel_likes
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "reel_likes_insert_own" ON public.reel_likes;
CREATE POLICY "reel_likes_insert_own" ON public.reel_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "reel_likes_delete_own" ON public.reel_likes;
CREATE POLICY "reel_likes_delete_own" ON public.reel_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS reel_likes_reel_id_idx ON public.reel_likes(reel_id);

CREATE OR REPLACE FUNCTION public.sync_reel_likes_count()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.reels SET likes_count = likes_count + 1 WHERE id = NEW.reel_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.reels SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.reel_id;
  END IF;
  RETURN NULL;
END;
$$;
DROP TRIGGER IF EXISTS reel_likes_sync ON public.reel_likes;
CREATE TRIGGER reel_likes_sync AFTER INSERT OR DELETE ON public.reel_likes
  FOR EACH ROW EXECUTE FUNCTION public.sync_reel_likes_count();

-- Pin search_path on the sync_reel_likes_count trigger function so it
-- cannot be hijacked by a malicious schema in the role's search_path.
ALTER FUNCTION public.sync_reel_likes_count() SET search_path = public;

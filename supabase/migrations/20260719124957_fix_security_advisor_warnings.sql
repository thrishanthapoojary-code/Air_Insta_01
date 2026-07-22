/*
# Air Insta — fix security advisor warnings

1. Overview
   Resolves three Supabase security advisor warnings:
   a) "Public Bucket Allows Listing" — the media bucket had a broad SELECT
      policy allowing anyone to list all stored objects via the Storage API.
   b) "Public Can Execute SECURITY DEFINER Function" — the
      delete_expired_stories() function was executable by the anon role.
   c) "Signed-In Users Can Execute SECURITY DEFINER Function" — the same
      function was executable by the authenticated role.

2. Changes
   a) Storage: DROP the "media_read_public" SELECT policy on storage.objects.
      The bucket remains public so public URLs (getPublicUrl) still serve
      files directly via the CDN endpoint without RLS. Removing the SELECT
      policy only blocks the Storage API `list()` call — public URL reads
      are unaffected because public buckets serve via a separate endpoint
      that does not consult storage.objects RLS policies.
   b) Function: REVOKE EXECUTE on public.delete_expired_stories() from
      PUBLIC, anon, and authenticated. GRANT EXECUTE only to service_role
      (the role used by server-side scheduled cleanup). The function stays
      SECURITY DEFINER so it can delete rows bypassing RLS when invoked by
      the service_role, but no client-facing role can call it.

3. Security
   - No new tables or columns.
   - Storage bucket `media` remains public (for CDN URL serving) but no
     longer allows API-level listing.
   - SECURITY DEFINER function now only executable by service_role.

4. Notes
   - The app reads media via public URLs (getPublicUrl), which do not
     require a storage.objects SELECT policy on public buckets.
   - The delete_expired_stories() function is intended for server-side
     scheduled cleanup only; client roles never need to call it.
*/

-- ---------- Fix 1: Remove storage listing policy ----------
-- Public buckets serve files via the public CDN URL without RLS.
-- The SELECT policy only controlled API `list()` — removing it blocks
-- listing while keeping public URL reads working.
DROP POLICY IF EXISTS "media_read_public" ON storage.objects;

-- ---------- Fix 2: Lock down SECURITY DEFINER function ----------
REVOKE ALL ON FUNCTION public.delete_expired_stories() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_expired_stories() FROM anon;
REVOKE ALL ON FUNCTION public.delete_expired_stories() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.delete_expired_stories() TO service_role;

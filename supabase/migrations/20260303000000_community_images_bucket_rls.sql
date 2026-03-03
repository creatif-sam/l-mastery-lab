-- ============================================================
-- community-images storage bucket + RLS policies
-- Run this in the Supabase SQL Editor or add to your migrations
-- ============================================================

-- 1. Create the bucket (public so getPublicUrl works without signing)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-images',
  'community-images',
  true,                          -- public bucket → CDN URLs work immediately
  5242880,                       -- 5 MB per file
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE
  SET public            = EXCLUDED.public,
      file_size_limit   = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================
-- 2. Policies
--    (RLS on storage.objects is already enabled by Supabase —
--     you cannot ALTER that system table directly)
-- ============================================================

-- DROP existing policies before re-creating (idempotent)
DROP POLICY IF EXISTS "community-images: public read"         ON storage.objects;
DROP POLICY IF EXISTS "community-images: authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "community-images: owner delete"        ON storage.objects;
DROP POLICY IF EXISTS "community-images: admin delete"        ON storage.objects;

-- 3a. Anyone can VIEW images (needed for <img src="...publicUrl" />)
CREATE POLICY "community-images: public read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'community-images');

-- 3b. Any authenticated user can UPLOAD to their own subfolder
--     Path format: community/<user-id>/<timestamp>.<ext>
CREATE POLICY "community-images: authenticated upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'community-images'
  AND (storage.foldername(name))[1] = 'community'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- 3c. File owner can DELETE their own files
CREATE POLICY "community-images: owner delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'community-images'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- 3d. Admins can DELETE any file in the bucket
--     (relies on a profiles/users table with a role column)
CREATE POLICY "community-images: admin delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'community-images'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id   = auth.uid()
      AND profiles.role = 'admin'
  )
);

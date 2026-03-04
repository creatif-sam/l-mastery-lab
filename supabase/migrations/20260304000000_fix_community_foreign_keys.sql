-- =====================================================
-- FIX: Update foreign key references for community tables
-- =====================================================
-- This fixes the foreign key references in case they're pointing to auth.users
-- instead of profiles table
-- =====================================================

-- Drop and recreate community_posts with correct foreign key
ALTER TABLE IF EXISTS community_posts DROP CONSTRAINT IF EXISTS community_posts_author_id_fkey;
ALTER TABLE community_posts 
  ADD CONSTRAINT community_posts_author_id_fkey 
  FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Drop and recreate community_reactions with correct foreign key
ALTER TABLE IF EXISTS community_reactions DROP CONSTRAINT IF EXISTS community_reactions_user_id_fkey;
ALTER TABLE community_reactions 
  ADD CONSTRAINT community_reactions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Drop and recreate community_comments with correct foreign key
ALTER TABLE IF EXISTS community_comments DROP CONSTRAINT IF EXISTS community_comments_author_id_fkey;
ALTER TABLE community_comments 
  ADD CONSTRAINT community_comments_author_id_fkey 
  FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- =====================================================
-- END OF FIX
-- =====================================================

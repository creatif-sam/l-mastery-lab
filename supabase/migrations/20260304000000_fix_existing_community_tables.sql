-- =====================================================
-- FIX EXISTING COMMUNITY TABLES SCHEMA
-- =====================================================
-- This migration updates the existing community tables
-- to add any missing columns needed for the app to work
-- =====================================================

-- ─────────────────────────────────────────────────────
-- 1. FIX COMMUNITY_REACTIONS TABLE
-- ─────────────────────────────────────────────────────

-- Add missing columns if they don't exist
DO $$
BEGIN
  -- Ensure id column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'community_reactions' AND column_name = 'id'
  ) THEN
    ALTER TABLE community_reactions ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
  END IF;

  -- Ensure post_id column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'community_reactions' AND column_name = 'post_id'
  ) THEN
    ALTER TABLE community_reactions ADD COLUMN post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE;
  END IF;

  -- Ensure user_id column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'community_reactions' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE community_reactions ADD COLUMN user_id UUID NOT NULL;
  END IF;

  -- Ensure type column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'community_reactions' AND column_name = 'type'
  ) THEN
    ALTER TABLE community_reactions ADD COLUMN type TEXT NOT NULL;
  END IF;

  -- Ensure created_at column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'community_reactions' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE community_reactions ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Add CHECK constraint for type if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'community_reactions_type_check'
  ) THEN
    ALTER TABLE community_reactions ADD CONSTRAINT community_reactions_type_check CHECK (type IN ('like', 'love'));
  END IF;
END $$;

-- Add UNIQUE constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'community_reactions_post_user_type_unique'
  ) THEN
    ALTER TABLE community_reactions ADD CONSTRAINT community_reactions_post_user_type_unique UNIQUE(post_id, user_id, type);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────
-- 2. FIX COMMUNITY_COMMENTS TABLE
-- ─────────────────────────────────────────────────────

DO $$
BEGIN
  -- Ensure id column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'community_comments' AND column_name = 'id'
  ) THEN
    ALTER TABLE community_comments ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
  END IF;

  -- Ensure post_id column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'community_comments' AND column_name = 'post_id'
  ) THEN
    ALTER TABLE community_comments ADD COLUMN post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE;
  END IF;

  -- Ensure author_id column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'community_comments' AND column_name = 'author_id'
  ) THEN
    ALTER TABLE community_comments ADD COLUMN author_id UUID NOT NULL;
  END IF;

  -- Ensure content column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'community_comments' AND column_name = 'content'
  ) THEN
    ALTER TABLE community_comments ADD COLUMN content TEXT NOT NULL;
  END IF;

  -- Ensure created_at column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'community_comments' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE community_comments ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- Ensure updated_at column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'community_comments' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE community_comments ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- ─────────────────────────────────────────────────────
-- 3. FIX COMMUNITY_POSTS TABLE
-- ─────────────────────────────────────────────────────

DO $$
BEGIN
  -- Ensure likes_count column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'community_posts' AND column_name = 'likes_count'
  ) THEN
    ALTER TABLE community_posts ADD COLUMN likes_count INTEGER DEFAULT 0;
  END IF;

  -- Ensure loves_count column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'community_posts' AND column_name = 'loves_count'
  ) THEN
    ALTER TABLE community_posts ADD COLUMN loves_count INTEGER DEFAULT 0;
  END IF;

  -- Ensure comments_count column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'community_posts' AND column_name = 'comments_count'
  ) THEN
    ALTER TABLE community_posts ADD COLUMN comments_count INTEGER DEFAULT 0;
  END IF;

  -- Ensure image_url column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'community_posts' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE community_posts ADD COLUMN image_url TEXT;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ─────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_community_reactions_post ON community_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_community_reactions_user ON community_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_post ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_author ON community_comments(author_id);

-- ─────────────────────────────────────────────────────
-- 5. FIX FOREIGN KEYS
-- ─────────────────────────────────────────────────────

-- Drop existing foreign keys and recreate them properly
ALTER TABLE community_reactions DROP CONSTRAINT IF EXISTS community_reactions_user_id_fkey;
ALTER TABLE community_reactions DROP CONSTRAINT IF EXISTS community_reactions_post_id_fkey;

ALTER TABLE community_comments DROP CONSTRAINT IF EXISTS community_comments_author_id_fkey;
ALTER TABLE community_comments DROP CONSTRAINT IF EXISTS community_comments_post_id_fkey;

-- Add foreign keys pointing to profiles table
ALTER TABLE community_reactions 
  ADD CONSTRAINT community_reactions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE community_reactions 
  ADD CONSTRAINT community_reactions_post_id_fkey 
  FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE;

ALTER TABLE community_comments 
  ADD CONSTRAINT community_comments_author_id_fkey 
  FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE community_comments 
  ADD CONSTRAINT community_comments_post_id_fkey 
  FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE;

-- =====================================================
-- END OF MIGRATION
-- =====================================================

-- To verify the schema, run:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'community_reactions' 
-- ORDER BY ordinal_position;

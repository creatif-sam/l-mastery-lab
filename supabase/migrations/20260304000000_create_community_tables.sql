-- =====================================================
-- CREATE COMMUNITY TABLES
-- =====================================================
-- This migration creates the tables needed for community features
-- Run this BEFORE the RLS policies migration
-- =====================================================

-- ─────────────────────────────────────────────────────
-- 1. COMMUNITY POSTS TABLE
-- ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  likes_count INTEGER DEFAULT 0,
  loves_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_community_posts_author ON community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_org ON community_posts(organization_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created ON community_posts(created_at DESC);

-- ─────────────────────────────────────────────────────
-- 2. COMMUNITY REACTIONS TABLE (Likes & Loves)
-- ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS community_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'love')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id, type)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_community_reactions_post ON community_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_community_reactions_user ON community_reactions(user_id);

-- ─────────────────────────────────────────────────────
-- 3. COMMUNITY COMMENTS TABLE
-- ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_community_comments_post ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_author ON community_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_created ON community_comments(created_at);

-- ─────────────────────────────────────────────────────
-- 4. TRIGGERS TO UPDATE COUNTS
-- ─────────────────────────────────────────────────────

-- Function to update likes/loves count on community_posts
CREATE OR REPLACE FUNCTION update_reaction_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'like' THEN
      UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    ELSIF NEW.type = 'love' THEN
      UPDATE community_posts SET loves_count = loves_count + 1 WHERE id = NEW.post_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.type = 'like' THEN
      UPDATE community_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
    ELSIF OLD.type = 'love' THEN
      UPDATE community_posts SET loves_count = GREATEST(0, loves_count - 1) WHERE id = OLD.post_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for reactions
DROP TRIGGER IF EXISTS trigger_update_reaction_counts ON community_reactions;
CREATE TRIGGER trigger_update_reaction_counts
  AFTER INSERT OR DELETE ON community_reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_reaction_counts();

-- Function to update comments count on community_posts
CREATE OR REPLACE FUNCTION update_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for comments
DROP TRIGGER IF EXISTS trigger_update_comments_count ON community_comments;
CREATE TRIGGER trigger_update_comments_count
  AFTER INSERT OR DELETE ON community_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comments_count();

-- Function to award points for community engagement
CREATE OR REPLACE FUNCTION award_community_points()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Award points for posting (1 point)
    IF TG_TABLE_NAME = 'community_posts' THEN
      UPDATE profiles SET community_points = community_points + 1 WHERE id = NEW.author_id;
    -- Award points for commenting (0.5 points)
    ELSIF TG_TABLE_NAME = 'community_comments' THEN
      UPDATE profiles SET community_points = community_points + 0.5 WHERE id = NEW.author_id;
    -- Award points for reacting (0.1 points)
    ELSIF TG_TABLE_NAME = 'community_reactions' THEN
      UPDATE profiles SET community_points = community_points + 0.1 WHERE id = NEW.user_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- Remove points when content is deleted
    IF TG_TABLE_NAME = 'community_posts' THEN
      UPDATE profiles SET community_points = GREATEST(0, community_points - 1) WHERE id = OLD.author_id;
    ELSIF TG_TABLE_NAME = 'community_comments' THEN
      UPDATE profiles SET community_points = GREATEST(0, community_points - 0.5) WHERE id = OLD.author_id;
    ELSIF TG_TABLE_NAME = 'community_reactions' THEN
      UPDATE profiles SET community_points = GREATEST(0, community_points - 0.1) WHERE id = OLD.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for points
DROP TRIGGER IF EXISTS trigger_award_post_points ON community_posts;
CREATE TRIGGER trigger_award_post_points
  AFTER INSERT OR DELETE ON community_posts
  FOR EACH ROW
  EXECUTE FUNCTION award_community_points();

DROP TRIGGER IF EXISTS trigger_award_comment_points ON community_comments;
CREATE TRIGGER trigger_award_comment_points
  AFTER INSERT OR DELETE ON community_comments
  FOR EACH ROW
  EXECUTE FUNCTION award_community_points();

DROP TRIGGER IF EXISTS trigger_award_reaction_points ON community_reactions;
CREATE TRIGGER trigger_award_reaction_points
  AFTER INSERT OR DELETE ON community_reactions
  FOR EACH ROW
  EXECUTE FUNCTION award_community_points();

-- ─────────────────────────────────────────────────────
-- 5. INITIAL DATA CHECK
-- ─────────────────────────────────────────────────────

-- Ensure community_points column exists in profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'community_points'
  ) THEN
    ALTER TABLE profiles ADD COLUMN community_points NUMERIC DEFAULT 0;
  END IF;
END $$;

-- =====================================================
-- END OF MIGRATION
-- =====================================================

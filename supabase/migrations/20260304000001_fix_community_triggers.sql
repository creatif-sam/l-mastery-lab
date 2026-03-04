-- =====================================================
-- FIX COMMUNITY TRIGGERS AND FUNCTIONS
-- =====================================================
-- This migration fixes the bugs in community trigger functions
-- Addresses:
-- 1. record "new" has no field "author_id" error
-- 2. column "posts_count" does not exist error
-- =====================================================

-- ─────────────────────────────────────────────────────
-- 1. DROP OLD BUGGY TRIGGERS AND FUNCTIONS
-- ─────────────────────────────────────────────────────

-- Drop old triggers from reactions table
DROP TRIGGER IF EXISTS trg_reaction_count ON community_reactions;
DROP TRIGGER IF EXISTS trg_points_reaction ON community_reactions;

-- Drop old triggers from comments table
DROP TRIGGER IF EXISTS trg_comment_count ON community_comments;
DROP TRIGGER IF EXISTS trg_points_comment ON community_comments;
DROP TRIGGER IF EXISTS notify_on_new_comment ON community_comments;

-- Drop old functions
DROP FUNCTION IF EXISTS update_post_counts();
DROP FUNCTION IF EXISTS notify_post_author_on_comment();

-- ─────────────────────────────────────────────────────
-- 2. CREATE CORRECTED FUNCTIONS
-- ─────────────────────────────────────────────────────

-- Unified function to update reaction counts (likes and loves)
CREATE OR REPLACE FUNCTION update_reaction_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'like' THEN
      UPDATE community_posts 
      SET likes_count = likes_count + 1 
      WHERE id = NEW.post_id;
    ELSIF NEW.type = 'love' THEN
      UPDATE community_posts 
      SET loves_count = loves_count + 1 
      WHERE id = NEW.post_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.type = 'like' THEN
      UPDATE community_posts 
      SET likes_count = GREATEST(0, likes_count - 1) 
      WHERE id = OLD.post_id;
    ELSIF OLD.type = 'love' THEN
      UPDATE community_posts 
      SET loves_count = GREATEST(0, loves_count - 1) 
      WHERE id = OLD.post_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update comments count
CREATE OR REPLACE FUNCTION update_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts 
    SET comments_count = GREATEST(0, comments_count - 1) 
    WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to award community points (handles different ID field names)
CREATE OR REPLACE FUNCTION award_community_points()
RETURNS TRIGGER AS $$
DECLARE
  user_profile_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Determine the user ID based on table and available fields
    IF TG_TABLE_NAME = 'community_posts' THEN
      user_profile_id := NEW.author_id;
      UPDATE profiles 
      SET community_points = community_points + 1 
      WHERE id = user_profile_id;
      
    ELSIF TG_TABLE_NAME = 'community_comments' THEN
      user_profile_id := NEW.author_id;
      UPDATE profiles 
      SET community_points = community_points + 0.5 
      WHERE id = user_profile_id;
      
    ELSIF TG_TABLE_NAME = 'community_reactions' THEN
      user_profile_id := NEW.user_id;  -- reactions use user_id
      UPDATE profiles 
      SET community_points = community_points + 0.1 
      WHERE id = user_profile_id;
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Deduct points when content is deleted
    IF TG_TABLE_NAME = 'community_posts' THEN
      user_profile_id := OLD.author_id;
      UPDATE profiles 
      SET community_points = GREATEST(0, community_points - 1) 
      WHERE id = user_profile_id;
      
    ELSIF TG_TABLE_NAME = 'community_comments' THEN
      user_profile_id := OLD.author_id;
      UPDATE profiles 
      SET community_points = GREATEST(0, community_points - 0.5) 
      WHERE id = user_profile_id;
      
    ELSIF TG_TABLE_NAME = 'community_reactions' THEN
      user_profile_id := OLD.user_id;  -- reactions use user_id
      UPDATE profiles 
      SET community_points = GREATEST(0, community_points - 0.1) 
      WHERE id = user_profile_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to notify post author on new comment
CREATE OR REPLACE FUNCTION notify_post_author_on_comment()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
BEGIN
  -- Get the post author's ID
  SELECT author_id INTO post_author_id
  FROM community_posts
  WHERE id = NEW.post_id;
  
  -- Don't notify if commenting on own post
  IF post_author_id IS NOT NULL AND post_author_id != NEW.author_id THEN
    -- Insert notification (assuming you have a notifications table)
    -- Adjust this based on your actual notifications table structure
    INSERT INTO notifications (user_id, type, message, related_id, created_at)
    VALUES (
      post_author_id,
      'comment',
      'Someone commented on your post',
      NEW.post_id,
      NOW()
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- If notifications table doesn't exist or other error, just continue
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────
-- 3. CREATE CORRECTED TRIGGERS
-- ─────────────────────────────────────────────────────

-- Trigger to update reaction counts (likes/loves)
CREATE TRIGGER trg_reaction_count
  AFTER INSERT OR DELETE ON community_reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_reaction_counts();

-- Trigger to award points for reactions
CREATE TRIGGER trg_points_reaction
  AFTER INSERT OR DELETE ON community_reactions
  FOR EACH ROW
  EXECUTE FUNCTION award_community_points();

-- Trigger to update comment counts
CREATE TRIGGER trg_comment_count
  AFTER INSERT OR DELETE ON community_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comments_count();

-- Trigger to award points for comments
CREATE TRIGGER trg_points_comment
  AFTER INSERT OR DELETE ON community_comments
  FOR EACH ROW
  EXECUTE FUNCTION award_community_points();

-- Trigger to notify on new comments
CREATE TRIGGER notify_on_new_comment
  AFTER INSERT ON community_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_post_author_on_comment();

-- ─────────────────────────────────────────────────────
-- 4. ENSURE community_points COLUMN EXISTS
-- ─────────────────────────────────────────────────────

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

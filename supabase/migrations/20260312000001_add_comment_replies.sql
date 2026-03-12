-- =====================================================
-- ADD REPLY THREADING TO COMMUNITY COMMENTS
-- =====================================================
-- Adds parent_comment_id so users can reply to comments
-- in a LinkedIn-style nested thread (1 level deep).
-- =====================================================

ALTER TABLE community_comments
  ADD COLUMN IF NOT EXISTS parent_comment_id UUID
    REFERENCES community_comments(id) ON DELETE CASCADE;

-- Index for fast reply lookups by parent
CREATE INDEX IF NOT EXISTS idx_community_comments_parent
  ON community_comments(parent_comment_id)
  WHERE parent_comment_id IS NOT NULL;

-- =====================================================
-- END OF MIGRATION
-- =====================================================

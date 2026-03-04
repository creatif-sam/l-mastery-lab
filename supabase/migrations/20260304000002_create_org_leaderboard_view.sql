-- =====================================================
-- CREATE ORG LEADERBOARD VIEW
-- =====================================================
-- This migration creates a view for organization leaderboards
-- that shows each user's top quiz score
-- =====================================================

-- Drop view if exists
DROP VIEW IF EXISTS org_leaderboard;

-- Create materialized view for better performance
CREATE OR REPLACE VIEW org_leaderboard AS
SELECT 
  p.id AS profile_id,
  p.full_name,
  p.organization_id,
  COALESCE(MAX(qa.score), 0) AS top_score
FROM 
  profiles p
LEFT JOIN 
  quiz_attempts qa ON qa.user_id = p.id
GROUP BY 
  p.id, p.full_name, p.organization_id;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_org_leaderboard_org 
ON profiles(organization_id) 
WHERE organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user 
ON quiz_attempts(user_id);

-- =====================================================
-- END OF MIGRATION
-- =====================================================

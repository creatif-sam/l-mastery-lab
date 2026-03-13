-- ============================================================
-- Migration: Schema Fixes & Additions
-- Date: 2026-03-13
-- ============================================================

-- 1. Add created_by column to quizzes table
ALTER TABLE quizzes
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Create site_config table (key-value store for platform settings)
CREATE TABLE IF NOT EXISTS site_config (
  config_key   TEXT PRIMARY KEY,
  config_value TEXT,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default keys
INSERT INTO site_config (config_key, config_value)
VALUES ('onboarding_video_url', NULL)
ON CONFLICT (config_key) DO NOTHING;

-- RLS for site_config
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can read site config
CREATE POLICY "site_config_read_all"
  ON site_config FOR SELECT
  USING (true);

-- Only admins can insert / update / delete site config
CREATE POLICY "site_config_admin_write"
  ON site_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- 3. Add group_id column to profiles (if not already present)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS group_id UUID;

-- Index for fast group lookups
CREATE INDEX IF NOT EXISTS idx_profiles_group_id ON profiles(group_id);

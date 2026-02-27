-- ============================================================
-- LML Platform – New Features Migration (2026-02-27)
-- ============================================================

-- 1. Organizations table already exists – add description column if missing
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Add avatar_url to profiles (if not exist)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 3. Create messages table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS messages (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  title        TEXT,
  is_read      BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Add title column if the table already existed without it (backwards-compat)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS title TEXT;

-- 5. Seed default organization so foreign-key usage is valid
INSERT INTO organizations (name, slug, description)
SELECT 'Default Organization', 'default', 'Auto-created default organization'
WHERE NOT EXISTS (SELECT 1 FROM organizations LIMIT 1);

-- 6. RLS policies – allow authenticated users to read/write their own messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their messages"   ON messages;
DROP POLICY IF EXISTS "Users can send messages"         ON messages;
DROP POLICY IF EXISTS "Users can mark messages as read" ON messages;

CREATE POLICY "Users can view their messages"
  ON messages FOR SELECT
  USING (auth.uid() = receiver_id OR auth.uid() = sender_id);

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can mark messages as read"
  ON messages FOR UPDATE
  USING (auth.uid() = receiver_id);

-- 7. RLS for organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can view organizations" ON organizations;
CREATE POLICY "Anyone authenticated can view organizations"
  ON organizations FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage organizations" ON organizations;
CREATE POLICY "Admins can manage organizations"
  ON organizations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- LML Platform – Community Tables Migration (2026-02-27)
-- Creates community_posts, community_comments, community_reactions
-- with explicit FK constraint names matching the client queries.
-- ============================================================

-- 1. Add community_points to profiles if missing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS community_points NUMERIC DEFAULT 0;

-- ============================================================
-- 2. community_posts
-- ============================================================
CREATE TABLE IF NOT EXISTS public.community_posts (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id       UUID NOT NULL,
  organization_id UUID,
  content         TEXT NOT NULL,
  image_url       TEXT,
  likes_count     INT  DEFAULT 0,
  loves_count     INT  DEFAULT 0,
  comments_count  INT  DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT community_posts_author_id_fkey
    FOREIGN KEY (author_id)  REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT community_posts_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL
);

-- If the table was created without explicit FK names, add the named constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'community_posts_author_id_fkey'
      AND conrelid = 'public.community_posts'::regclass
  ) THEN
    ALTER TABLE public.community_posts
      ADD CONSTRAINT community_posts_author_id_fkey
      FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view posts"     ON public.community_posts;
DROP POLICY IF EXISTS "Users can create posts"                 ON public.community_posts;
DROP POLICY IF EXISTS "Users can delete their own posts"       ON public.community_posts;
DROP POLICY IF EXISTS "Admins can delete any post"             ON public.community_posts;

CREATE POLICY "Authenticated users can view posts"
  ON public.community_posts FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create posts"
  ON public.community_posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete their own posts"
  ON public.community_posts FOR DELETE
  USING (auth.uid() = author_id);

CREATE POLICY "Admins can delete any post"
  ON public.community_posts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow users to update reaction counts
CREATE POLICY "Users can update post counts"
  ON public.community_posts FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ============================================================
-- 3. community_comments
-- ============================================================
CREATE TABLE IF NOT EXISTS public.community_comments (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id    UUID NOT NULL,
  author_id  UUID NOT NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT community_comments_post_id_fkey
    FOREIGN KEY (post_id)   REFERENCES public.community_posts(id) ON DELETE CASCADE,
  CONSTRAINT community_comments_author_id_fkey
    FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- If the table pre-existed without explicit FK names, add the named constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'community_comments_author_id_fkey'
      AND conrelid = 'public.community_comments'::regclass
  ) THEN
    ALTER TABLE public.community_comments
      ADD CONSTRAINT community_comments_author_id_fkey
      FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view comments"   ON public.community_comments;
DROP POLICY IF EXISTS "Users can post comments"                 ON public.community_comments;
DROP POLICY IF EXISTS "Users can delete their own comments"     ON public.community_comments;

CREATE POLICY "Authenticated users can view comments"
  ON public.community_comments FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can post comments"
  ON public.community_comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete their own comments"
  ON public.community_comments FOR DELETE
  USING (auth.uid() = author_id);

-- ============================================================
-- 4. community_reactions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.community_reactions (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id    UUID NOT NULL,
  user_id    UUID NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('like', 'love')),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT community_reactions_post_id_fkey
    FOREIGN KEY (post_id)  REFERENCES public.community_posts(id) ON DELETE CASCADE,
  CONSTRAINT community_reactions_user_id_fkey
    FOREIGN KEY (user_id)  REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Prevent duplicate reactions of the same type per user per post
  CONSTRAINT community_reactions_unique UNIQUE (post_id, user_id, type)
);

ALTER TABLE public.community_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view reactions"         ON public.community_reactions;
DROP POLICY IF EXISTS "Users can add reactions"          ON public.community_reactions;
DROP POLICY IF EXISTS "Users can remove their reactions" ON public.community_reactions;

CREATE POLICY "Users can view reactions"
  ON public.community_reactions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can add reactions"
  ON public.community_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their reactions"
  ON public.community_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 5. Function to increment/decrement comment/reaction counts
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_post_comments(post_id UUID)
RETURNS void LANGUAGE sql AS $$
  UPDATE public.community_posts
  SET comments_count = comments_count + 1
  WHERE id = post_id;
$$;

CREATE OR REPLACE FUNCTION public.decrement_post_comments(post_id UUID)
RETURNS void LANGUAGE sql AS $$
  UPDATE public.community_posts
  SET comments_count = GREATEST(0, comments_count - 1)
  WHERE id = post_id;
$$;

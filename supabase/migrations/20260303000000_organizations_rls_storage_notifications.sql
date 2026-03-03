-- ============================================================
-- ORGANISATIONS — RLS, STORAGE & NOTIFICATION TRIGGER
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- 1. STORAGE BUCKET for organisation logos
-- ──────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'org-logos',
  'org-logos',
  true,
  2097152,          -- 2 MB max
  ARRAY['image/jpeg','image/png','image/webp','image/svg+xml','image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────────────────────
-- 1b. STORAGE BUCKET for user avatars
-- ──────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,          -- 2 MB max
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Anyone can read avatars (they are public profile images)
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Authenticated users can upload their own avatar
-- Path convention: <user_id>.<ext>  (flat, no subfolder inside the 'avatars' bucket)
DROP POLICY IF EXISTS "avatars_owner_insert" ON storage.objects;
CREATE POLICY "avatars_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND starts_with(name, auth.uid()::text)
  );

DROP POLICY IF EXISTS "avatars_owner_update" ON storage.objects;
CREATE POLICY "avatars_owner_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND starts_with(name, auth.uid()::text)
  );

DROP POLICY IF EXISTS "avatars_owner_delete" ON storage.objects;
CREATE POLICY "avatars_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND starts_with(name, auth.uid()::text)
  );

-- Anyone authenticated can read (logos are public references)
DROP POLICY IF EXISTS "org_logos_public_read" ON storage.objects;
CREATE POLICY "org_logos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'org-logos');

-- Only admins can upload / replace logos
DROP POLICY IF EXISTS "org_logos_admin_insert" ON storage.objects;
CREATE POLICY "org_logos_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'org-logos'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "org_logos_admin_update" ON storage.objects;
CREATE POLICY "org_logos_admin_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'org-logos'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "org_logos_admin_delete" ON storage.objects;
CREATE POLICY "org_logos_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'org-logos'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- ──────────────────────────────────────────────────────────
-- 2. RLS ON organizations TABLE
-- ──────────────────────────────────────────────────────────
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 2a. Members can read their own organisation
DROP POLICY IF EXISTS "org_members_can_read_own" ON public.organizations;
CREATE POLICY "org_members_can_read_own"
  ON public.organizations FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      -- User belongs to this org
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND organization_id = organizations.id
      )
      OR
      -- User is admin → can read all
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

-- 2b. Only admins can create organisations
DROP POLICY IF EXISTS "org_admin_insert" ON public.organizations;
CREATE POLICY "org_admin_insert"
  ON public.organizations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 2c. Only admins can update organisations
DROP POLICY IF EXISTS "org_admin_update" ON public.organizations;
CREATE POLICY "org_admin_update"
  ON public.organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 2d. Only admins can delete organisations
DROP POLICY IF EXISTS "org_admin_delete" ON public.organizations;
CREATE POLICY "org_admin_delete"
  ON public.organizations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- ──────────────────────────────────────────────────────────
-- 3. NOTIFICATION TRIGGER — alert all members when org changes
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_org_members_on_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _changed_fields text := '';
BEGIN
  -- Build a human-readable list of what changed
  IF OLD.name IS DISTINCT FROM NEW.name THEN
    _changed_fields := _changed_fields || 'name, ';
  END IF;
  IF OLD.description IS DISTINCT FROM NEW.description THEN
    _changed_fields := _changed_fields || 'description, ';
  END IF;
  IF OLD.logo_url IS DISTINCT FROM NEW.logo_url THEN
    _changed_fields := _changed_fields || 'logo, ';
  END IF;
  IF OLD.slug IS DISTINCT FROM NEW.slug THEN
    _changed_fields := _changed_fields || 'slug, ';
  END IF;

  -- Trim trailing ", "
  _changed_fields := rtrim(_changed_fields, ', ');

  -- Only notify when something actually changed
  IF _changed_fields = '' THEN
    RETURN NEW;
  END IF;

  -- Insert one notification per member of this org
  INSERT INTO public.notifications (user_id, title, message, type, link)
  SELECT
    p.id,
    'Organisation Updated',
    'Your organisation "' || NEW.name || '" has been updated (' || _changed_fields || ').',
    'info',
    CASE p.role
      WHEN 'tutor'   THEN '/protected/tutor'
      WHEN 'admin'   THEN '/protected/admin/organizations'
      ELSE                '/protected/student-board'
    END
  FROM public.profiles p
  WHERE p.organization_id = NEW.id;

  RETURN NEW;
END;
$$;

-- Drop old trigger if it exists, then recreate
DROP TRIGGER IF EXISTS trg_org_updated ON public.organizations;

CREATE TRIGGER trg_org_updated
  AFTER UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_org_members_on_update();

-- ============================================================
-- Add organization_id to profiles
-- ============================================================
-- The profiles table was created without an organization_id FK.
-- This column is required by the tutor/student dashboards and
-- the org-notification trigger that was added in the previous
-- migration.  Adding it here so it can be applied independently.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS organization_id uuid NULL
    REFERENCES public.organizations (id) ON DELETE SET NULL;

-- Index speeds up the "fetch all members of an org" queries
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id
  ON public.profiles USING btree (organization_id);

-- Allow members to read their own org row (relies on the column
-- already being present, so placed after the ALTER TABLE above)
-- Nothing extra needed here – the RLS policy in the previous
-- migration already covers it via the organization_id check.

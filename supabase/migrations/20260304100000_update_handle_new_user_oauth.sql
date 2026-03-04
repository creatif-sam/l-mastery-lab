-- ============================================================
-- Update Handle New User to Support OAuth Providers
-- ============================================================
-- This migration updates the handle_new_user function to properly
-- handle both email signups and OAuth providers (Google, etc.)

-- Drop existing function
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Recreate with better OAuth support
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile with metadata from either email signup or OAuth
  INSERT INTO public.profiles (
    id,
    full_name,
    avatar_url,
    role,
    organization_id,
    target_language,
    country_birth,
    country_residence,
    xp,
    level,
    community_points
  )
  VALUES (
    NEW.id,
    -- Get name from OAuth (name, full_name) or email signup (full_name)
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      ''
    ),
    -- Get avatar from OAuth (picture, avatar_url) or email signup (avatar_url)
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture',
      NULL
    ),
    -- Default role is student for OAuth, or from signup metadata
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    -- Organization ID (only from email signup, not OAuth)
    COALESCE((NEW.raw_user_meta_data->>'organization_id')::uuid, NULL),
    -- Target language (only from email signup, not OAuth)
    COALESCE(NEW.raw_user_meta_data->>'target_language', NULL),
    -- Country of birth (only from email signup, not OAuth)
    COALESCE(NEW.raw_user_meta_data->>'country_birth', NULL),
    -- Country of residence (only from email signup, not OAuth)
    COALESCE(NEW.raw_user_meta_data->>'country_residence', NULL),
    0,  -- xp starts at 0
    1,  -- level starts at 1
    0   -- community_points starts at 0
  )
  ON CONFLICT (id) DO UPDATE SET
    -- If profile already exists (race condition), update with OAuth data
    full_name = COALESCE(
      EXCLUDED.full_name,
      public.profiles.full_name
    ),
    avatar_url = COALESCE(
      EXCLUDED.avatar_url,
      public.profiles.avatar_url
    ),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Add comment
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates/updates a profile when a new user signs up via email or OAuth (Google, etc.)';

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
DECLARE
  org_id_val UUID;
BEGIN
  -- Safely parse organization_id if it exists
  BEGIN
    org_id_val := (NEW.raw_user_meta_data->>'organization_id')::uuid;
  EXCEPTION WHEN OTHERS THEN
    org_id_val := NULL;
  END;

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
    community_points,
    group_id
  )
  VALUES (
    NEW.id,
    -- Get name from OAuth (name, full_name) or email signup (full_name)
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)  -- Fallback to email username
    ),
    -- Get avatar from OAuth (picture, avatar_url) or email signup (avatar_url)
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture',
      NULL
    ),
    -- Default role is student for OAuth, or from signup metadata (cast to app_role)
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')::public.app_role,
    -- Organization ID (only from email signup, not OAuth)
    org_id_val,
    -- Target language (only from email signup, not OAuth)
    NEW.raw_user_meta_data->>'target_language',
    -- Country of birth (only from email signup, not OAuth)
    NEW.raw_user_meta_data->>'country_birth',
    -- Country of residence (only from email signup, not OAuth)
    NEW.raw_user_meta_data->>'country_residence',
    0,  -- xp starts at 0
    1,  -- level starts at 1
    0.00,  -- community_points starts at 0.00 (numeric)
    NULL  -- group_id starts as NULL
  )
  ON CONFLICT (id) DO UPDATE SET
    -- If profile already exists (race condition), update with OAuth data only if new data provided
    full_name = CASE
      WHEN EXCLUDED.full_name IS NOT NULL AND EXCLUDED.full_name != '' 
      THEN EXCLUDED.full_name
      ELSE public.profiles.full_name
    END,
    avatar_url = CASE
      WHEN EXCLUDED.avatar_url IS NOT NULL 
      THEN EXCLUDED.avatar_url
      ELSE public.profiles.avatar_url
    END,
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
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

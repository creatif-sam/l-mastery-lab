-- ============================================================
-- Fix Security Warnings - Views and Functions
-- ============================================================
-- This migration fixes security definer views and adds search_path
-- to functions to resolve security warnings.

-- ============================================================
-- 1. FIX SECURITY DEFINER VIEWS
-- ============================================================

-- Drop and recreate organization_network view without SECURITY DEFINER
DROP VIEW IF EXISTS public.organization_network CASCADE;

CREATE OR REPLACE VIEW public.organization_network AS
SELECT 
  o.id,
  o.name,
  o.logo_url,
  COUNT(DISTINCT p.id) as member_count,
  COUNT(DISTINCT CASE WHEN p.role = 'tutor' THEN p.id END) as tutor_count,
  COUNT(DISTINCT CASE WHEN p.role = 'student' THEN p.id END) as student_count
FROM public.organizations o
LEFT JOIN public.profiles p ON p.organization_id = o.id
GROUP BY o.id, o.name, o.logo_url;

-- Grant access to authenticated users
GRANT SELECT ON public.organization_network TO authenticated;

-- Drop and recreate org_leaderboard view without SECURITY DEFINER
DROP VIEW IF EXISTS public.org_leaderboard CASCADE;

CREATE OR REPLACE VIEW public.org_leaderboard AS
SELECT 
  o.id as organization_id,
  o.name as organization_name,
  o.logo_url,
  SUM(p.xp) as total_xp,
  SUM(p.community_points) as total_community_points,
  COUNT(p.id) as member_count,
  AVG(p.level) as avg_level
FROM public.organizations o
LEFT JOIN public.profiles p ON p.organization_id = o.id
GROUP BY o.id, o.name, o.logo_url
ORDER BY total_xp DESC;

-- Grant access to authenticated users
GRANT SELECT ON public.org_leaderboard TO authenticated;

-- ============================================================
-- 2. FIX FUNCTION SEARCH PATHS
-- ============================================================

-- Fix increment_post_comments
CREATE OR REPLACE FUNCTION public.increment_post_comments()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.community_posts
  SET comments_count = comments_count + 1,
      updated_at = NOW()
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$;

-- Fix decrement_post_comments
CREATE OR REPLACE FUNCTION public.decrement_post_comments()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.community_posts
  SET comments_count = GREATEST(0, comments_count - 1),
      updated_at = NOW()
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$;

-- Fix award_community_points
CREATE OR REPLACE FUNCTION public.award_community_points(
  user_id uuid,
  points integer,
  reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET community_points = community_points + points,
      updated_at = NOW()
  WHERE id = user_id;
  
  -- Optionally log the points award
  IF reason IS NOT NULL THEN
    INSERT INTO public.activity_log (user_id, action, details)
    VALUES (user_id, 'community_points_awarded', jsonb_build_object('points', points, 'reason', reason));
  END IF;
END;
$$;

-- Fix update_post_counts
CREATE OR REPLACE FUNCTION public.update_post_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles
    SET posts_count = posts_count + 1
    WHERE id = NEW.author_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles
    SET posts_count = GREATEST(0, posts_count - 1)
    WHERE id = OLD.author_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Fix handle_partner_acceptance
CREATE OR REPLACE FUNCTION public.handle_partner_acceptance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    -- Send notification to the requester
    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (
      NEW.requester_id,
      'partner_accepted',
      'Partner Request Accepted',
      'Your partner request has been accepted!',
      NEW.id
    );
    
    -- Award community points
    PERFORM public.award_community_points(NEW.requester_id, 10, 'partner_accepted');
    PERFORM public.award_community_points(NEW.partner_id, 10, 'partner_accepted');
  END IF;
  RETURN NEW;
END;
$$;

-- Fix send_system_notification
CREATE OR REPLACE FUNCTION public.send_system_notification(
  target_user_id uuid,
  notification_type text,
  notification_title text,
  notification_message text,
  related_entity_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    related_id,
    is_read
  )
  VALUES (
    target_user_id,
    notification_type,
    notification_title,
    notification_message,
    related_entity_id,
    false
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- ============================================================
-- 3. NOTE ON RLS POLICY WARNINGS
-- ============================================================
-- The following policies are intentionally permissive:
-- - contact_messages: INSERT with true - allows public contact form
-- - page_views: INSERT with true - allows anonymous page tracking
-- 
-- These are acceptable use cases for permissive policies.
-- If you want to restrict them, you could add:
-- - Rate limiting via triggers
-- - IP-based restrictions
-- - Authenticated-only access
--
-- For now, we'll leave them as-is since they serve legitimate purposes.

-- ============================================================
-- 4. NOTE ON LEAKED PASSWORD PROTECTION
-- ============================================================
-- This is a Supabase Auth dashboard setting and cannot be
-- changed via SQL migration. To enable it:
-- 1. Go to Supabase Dashboard
-- 2. Navigate to Authentication > Settings
-- 3. Enable "Password strength and leaked password protection"
-- 4. Configure minimum password requirements

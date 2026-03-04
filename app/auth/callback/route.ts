import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";

/**
 * Handles authentication callbacks from Supabase:
 * 1. Email confirmation links (signs out after confirmation)
 * 2. OAuth providers like Google (keeps session and redirects to dashboard)
 * Supports both PKCE flow (code) and OTP flow (token_hash + type)
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  const supabase = await createClient();

  // Handle OTP flow (token_hash + type) - for email confirmations
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    
    if (!error) {
      // Email confirmed successfully - sign out and redirect to confirmation page
      await supabase.auth.signOut();
      redirect("/auth/confirmed");
    } else {
      redirect(`/auth/error?error=${encodeURIComponent(error.message)}`);
    }
  }

  // Handle PKCE flow (code) - for OAuth and modern email confirmations
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      // Check if this is an OAuth sign-in (Google) or email confirmation
      const isOAuth = data.user.app_metadata?.provider !== 'email';

      if (isOAuth) {
        // OAuth sign-in: Keep session and redirect to appropriate dashboard
        
        // Wait a moment for the database trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Fetch profile (should exist now from trigger)
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle();

        // Determine role (default to student if profile fetch failed)
        const userRole = profile?.role || "student";

        // Redirect based on role
        if (userRole === "admin") {
          redirect(`${origin}/protected/admin`);
        } else if (userRole === "tutor") {
          redirect(`${origin}/protected/tutor`);
        } else {
          redirect(`${origin}/protected/student-board`);
        }
      } else {
        // Email confirmation: Sign out and send to confirmed page
        await supabase.auth.signOut();
        redirect("/auth/confirmed");
      }
    }

    redirect(
      `/auth/error?error=${encodeURIComponent(error?.message || "Authentication failed")}`
    );
  }

  redirect("/auth/error?error=Invalid+confirmation+link");
}

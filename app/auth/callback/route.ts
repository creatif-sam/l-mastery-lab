import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

/**
 * Handles the email-confirmation redirect from Supabase.
 * Supabase appends ?code=xxx to whatever emailRedirectTo URL was set.
 * We exchange the code for a session, then send the user to the
 * /auth/confirmed page where they can click "Go to Login".
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Sign them out immediately — they should log in properly
      await supabase.auth.signOut();
      redirect("/auth/confirmed");
    }

    redirect(
      `/auth/error?error=${encodeURIComponent(error.message)}`
    );
  }

  redirect("/auth/error?error=Invalid+confirmation+link");
}

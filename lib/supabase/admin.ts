import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — ONLY ever import this in Server Components
 * or API Route Handlers. Never expose it to the browser.
 *
 * Uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS entirely, letting
 * server-side code read rows (e.g. organisations, groups) without being
 * blocked by row-level security policies written for end-users.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        // Prevent the admin client from persisting any session to cookies
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

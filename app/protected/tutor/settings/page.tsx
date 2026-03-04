import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { TutorSidebar } from "../components/structure/sidebar";
import { TutorHeader } from "../components/structure/header";
import { TutorSettingsClient } from "./settings-client";

// Force dynamic rendering and no caching to ensure fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TutorSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/auth/login");

  console.log("[TutorSettings] Fetching profile for user:", user.id);

  // Try admin client first
  const adminDb = createAdminClient();
  console.log("[TutorSettings] Admin client created successfully");
  
  let { data: profile, error: profileError } = await adminDb
    .from("profiles")
    .select("id, full_name, role, avatar_url, organization_id, target_language, country_birth, country_residence, xp, level, community_points")
    .eq("id", user.id)
    .single() as any;

  if (profileError) {
    console.error("[TutorSettings] Admin client profile fetch error:", JSON.stringify(profileError, null, 2));
    console.log("[TutorSettings] Trying fallback with regular client...");
    
    // Fallback to regular client
    const fallbackResult = await supabase
      .from("profiles")
      .select("id, full_name, role, avatar_url, organization_id, target_language, country_birth, country_residence, xp, level, community_points")
      .eq("id", user.id)
      .single();
    
    if (fallbackResult.error) {
      console.error("[TutorSettings] Regular client also failed:", JSON.stringify(fallbackResult.error, null, 2));
    } else {
      console.log("[TutorSettings] Regular client succeeded!");
      profile = fallbackResult.data;
      profileError = null;
    }
  }

  console.log("[TutorSettings] Final profile data:", profile);

  // Role check
  if (!profile || profile.role !== "tutor") {
    console.log("[TutorSettings] Not a tutor, redirecting. Role:", profile?.role);
    return redirect("/");
  }

  const safeProfile = {
    id:               profile?.id               ?? user.id,
    full_name:        profile?.full_name        ?? "",
    role:             profile?.role             ?? "tutor",
    avatar_url:       profile?.avatar_url       ?? null,
    organization_id:  profile?.organization_id  ?? null,
    email:            user.email                ?? "",
    target_language:  profile?.target_language  ?? null,
    country_birth:    profile?.country_birth    ?? null,
    country_residence: profile?.country_residence ?? null,
    xp:               profile?.xp               ?? 0,
    level:            profile?.level            ?? 1,
    community_points: profile?.community_points ?? 0,
  };

  // Fetch org and meetings in parallel
  console.log("[TutorSettings] User organization_id:", safeProfile.organization_id);
  
  const [orgResult, meetingsResult] = await Promise.all([
    safeProfile.organization_id
      ? adminDb.from("organizations").select("id, name, logo_url").eq("id", safeProfile.organization_id).single()
      : Promise.resolve({ data: null, error: null }),
    safeProfile.organization_id
      ? supabase
          .from("meetings")
          .select("id, title, platform, meeting_link, start_time, created_by")
          .eq("organization_id", safeProfile.organization_id)
          .gte("start_time", new Date().toISOString())
          .order("start_time", { ascending: true })
          .limit(20)
      : Promise.resolve({ data: [], error: null }),
  ]);

  let org: { id: string; name: string; logo_url: string | null } | null = null;

  if (orgResult.error) {
    console.error("[TutorSettings] org fetch error (admin client):", orgResult.error);
    // Try fallback with regular client
    if (safeProfile.organization_id) {
      console.log("[TutorSettings] Attempting fallback org fetch with regular client");
      const fallbackOrg = await supabase
        .from("organizations")
        .select("id, name, logo_url")
        .eq("id", safeProfile.organization_id)
        .single();
      if (fallbackOrg.error) {
        console.error("[TutorSettings] Fallback org fetch also failed:", fallbackOrg.error);
      } else {
        console.log("[TutorSettings] Fallback org fetched successfully:", fallbackOrg.data);
        org = fallbackOrg.data as any;
      }
    }
  } else {
    console.log("[TutorSettings] org fetched:", orgResult.data);
    org = orgResult.data as { id: string; name: string; logo_url: string | null } | null;
  }

  // Keep only meetings this tutor created
  const myMeetings = ((meetingsResult.data ?? []) as any[]).filter(
    (m) => m.created_by === user.id
  );

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] dark:bg-[#0B0F1A]">
      <TutorSidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TutorHeader title="Settings" subtitle="Manage your profile and account" />
        <main className="flex-1 overflow-y-auto p-6">
          <TutorSettingsClient
            profile={safeProfile}
            org={org}
            upcomingMeetings={myMeetings}
          />
        </main>
      </div>
    </div>
  );
}

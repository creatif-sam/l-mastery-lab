import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { TutorSidebar } from "../components/structure/sidebar";
import { TutorHeader } from "../components/structure/header";
import { TutorSettingsClient } from "./settings-client";

export default async function TutorSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/auth/login");

  // 1. Role check using a minimal, safe query
  const { data: roleRow } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!roleRow || roleRow.role !== "tutor") return redirect("/");

  // 2. Full profile — all editable and displayable columns
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, avatar_url, organization_id, group_id, created_at, target_language, country_birth, country_residence, xp, level, community_points")
    .eq("id", user.id)
    .single() as any;

  const safeProfile = {
    id:               profile?.id               ?? user.id,
    full_name:        profile?.full_name        ?? "",
    role:             profile?.role             ?? "tutor",
    avatar_url:       profile?.avatar_url       ?? null,
    organization_id:  profile?.organization_id  ?? null,
    group_id:         profile?.group_id         ?? null,
    created_at:       profile?.created_at       ?? new Date().toISOString(),
    email:            user.email                ?? "",
    target_language:  profile?.target_language  ?? null,
    country_birth:    profile?.country_birth    ?? null,
    country_residence: profile?.country_residence ?? null,
    xp:               profile?.xp               ?? 0,
    level:            profile?.level            ?? 1,
    community_points: profile?.community_points ?? 0,
  };

  // Use service-role client for org/group lookups so that row-level security
  // on those tables never silently blocks these server-side reads.
  const adminDb = createAdminClient();

  // Fetch org, group, and meetings in parallel
  const [orgResult, groupResult, meetingsResult] = await Promise.all([
    safeProfile.organization_id
      ? adminDb.from("organizations").select("id, name, logo_url").eq("id", safeProfile.organization_id).single()
      : Promise.resolve({ data: null, error: null }),
    safeProfile.group_id
      ? adminDb.from("groups").select("id, name").eq("id", safeProfile.group_id).single()
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

  if (orgResult.error) {
    console.error("[TutorSettings] org fetch error:", orgResult.error.message);
  }
  if (groupResult.error) {
    console.error("[TutorSettings] group fetch error:", groupResult.error.message);
  }

  const org = orgResult.data as { id: string; name: string; logo_url: string | null } | null;
  const group = groupResult.data as { id: string; name: string } | null;

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
            groupName={group?.name ?? null}
            upcomingMeetings={myMeetings}
          />
        </main>
      </div>
    </div>
  );
}

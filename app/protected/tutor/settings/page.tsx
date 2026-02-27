import { createClient } from "@/lib/supabase/server";
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

  // 2. Full profile — select each column individually so a missing optional
  //    column doesn't null-out the entire row
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, avatar_url, organization_id, created_at")
    .eq("id", user.id)
    .single() as any;

  const safeProfile = {
    id:              profile?.id              ?? user.id,
    full_name:       profile?.full_name       ?? "",
    role:            profile?.role            ?? "tutor",
    avatar_url:      profile?.avatar_url      ?? null,
    organization_id: profile?.organization_id ?? null,
    created_at:      profile?.created_at      ?? new Date().toISOString(),
    email:           user.email               ?? "",
  };

  const { data: org } = safeProfile.organization_id
    ? await supabase.from("organizations").select("name").eq("id", safeProfile.organization_id).single()
    : { data: null };

  // 3. Fetch upcoming meetings for this org (no created_by filter — handle in UI)
  const { data: upcomingMeetings } = safeProfile.organization_id
    ? await supabase
        .from("meetings")
        .select("id, title, platform, meeting_link, start_time, created_by")
        .eq("organization_id", safeProfile.organization_id)
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true })
        .limit(20)
    : { data: [] };

  // Keep only meetings this tutor created (safe even if created_by is null)
  const myMeetings = (upcomingMeetings ?? []).filter(
    (m: any) => m.created_by === user.id
  );

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] dark:bg-[#0B0F1A]">
      <TutorSidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TutorHeader title="Settings" subtitle="Manage your profile and account" />
        <main className="flex-1 overflow-y-auto p-6">
          <TutorSettingsClient
            profile={safeProfile}
            orgName={org?.name ?? null}
            upcomingMeetings={myMeetings}
          />
        </main>
      </div>
    </div>
  );
}

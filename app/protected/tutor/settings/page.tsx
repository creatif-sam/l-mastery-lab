import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TutorSidebar } from "../components/structure/sidebar";
import { TutorHeader } from "../components/structure/header";
import { TutorSettingsClient } from "./settings-client";

export default async function TutorSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, avatar_url, organization_id, created_at")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "tutor") return redirect("/");

  const { data: org } = profile.organization_id
    ? await supabase.from("organizations").select("name").eq("id", profile.organization_id).single()
    : { data: null };

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] dark:bg-[#0B0F1A]">
      <TutorSidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TutorHeader title="Settings" subtitle="Manage your profile and account" />
        <main className="flex-1 overflow-y-auto p-6">
          <TutorSettingsClient
            profile={{ ...profile, email: user.email ?? "" }}
            orgName={org?.name ?? null}
          />
        </main>
      </div>
    </div>
  );
}

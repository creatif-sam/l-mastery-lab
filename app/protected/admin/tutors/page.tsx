import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminSidebar } from "../components/structure/sidebar";
import { AdminHeader } from "../components/structure/header";
import { AdminTutorsClient } from "./tutors-client";

export default async function AdminTutorsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return redirect("/");

  const [{ data: tutors }, { data: organizations }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, role, organization_id, avatar_url, target_language, level, xp, updated_at")
      .eq("role", "tutor")
      .order("full_name"),
    supabase.from("organizations").select("id, name").order("name"),
  ]);

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] dark:bg-[#0B0F1A]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <AdminHeader title="Tutors" subtitle="View and assign tutors to organizations" />
        <main className="flex-1 overflow-y-auto p-6">
          <AdminTutorsClient
            initialTutors={tutors ?? []}
            organizations={organizations ?? []}
          />
        </main>
      </div>
    </div>
  );
}

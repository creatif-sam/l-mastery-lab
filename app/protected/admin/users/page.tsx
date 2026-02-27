import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminSidebar } from "../components/structure/sidebar";
import { AdminHeader } from "../components/structure/header";
import { AdminUsersClient } from "./users-client";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return redirect("/");

  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, role, target_language, level, xp, country_residence, organization_id, group_id, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] dark:bg-[#0B0F1A]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <AdminHeader title="Users" subtitle="Manage and monitor all platform users" />
        <main className="flex-1 overflow-y-auto p-6">
          <AdminUsersClient initialUsers={users || []} />
        </main>
      </div>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminSidebar } from "../components/structure/sidebar";
import { AdminHeader } from "../components/structure/header";
import { AdminOrganizationsClient } from "./organizations-client";

export default async function AdminOrganizationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "admin") return redirect("/");

  // Fetch organizations
  const { data: organizations } = await supabase
    .from("organizations")
    .select("id, name, slug, logo_url, description, created_at")
    .order("created_at", { ascending: false });

  // Fetch member counts per organization
  const { data: memberCounts } = await supabase
    .from("profiles")
    .select("organization_id")
    .not("organization_id", "is", null);

  const countMap: Record<string, number> = {};
  (memberCounts || []).forEach((p: any) => {
    if (p.organization_id) {
      countMap[p.organization_id] = (countMap[p.organization_id] || 0) + 1;
    }
  });

  const orgsWithCounts = (organizations || []).map((org) => ({
    ...org,
    member_count: countMap[org.id] || 0,
  }));

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] dark:bg-[#0B0F1A]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <AdminHeader
          title="Organizations"
          subtitle="Manage organisations on the platform"
        />
        <main className="flex-1 overflow-y-auto p-6">
          <AdminOrganizationsClient initialOrgs={orgsWithCounts} />
        </main>
      </div>
    </div>
  );
}

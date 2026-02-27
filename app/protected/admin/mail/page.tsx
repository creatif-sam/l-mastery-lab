import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminSidebar } from "../components/structure/sidebar";
import { AdminHeader } from "../components/structure/header";
import { MailClient } from "./mail-client";

export default async function AdminMailPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return redirect("/");

  const [
    { data: campaigns },
    { data: templates },
    { data: allUsers },
  ] = await Promise.all([
    supabase.from("email_campaigns").select("*").order("created_at", { ascending: false }),
    supabase.from("email_templates").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name, role, target_language"),
  ]);

  const stats = {
    total: campaigns?.length ?? 0,
    drafts: campaigns?.filter((c: any) => c.status === "draft").length ?? 0,
    sent: campaigns?.filter((c: any) => c.status === "sent").length ?? 0,
    totalEmailsSent: campaigns?.reduce((acc: number, c: any) => acc + (c.recipients_count || 0), 0) ?? 0,
  };

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] dark:bg-[#0B0F1A]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <AdminHeader title="Mail Campaigns" subtitle="Powered by Resend — send targeted email campaigns" />
        <main className="flex-1 overflow-y-auto p-6">
          <MailClient
            initialCampaigns={campaigns || []}
            initialTemplates={templates || []}
            stats={stats}
            allUsers={allUsers || []}
          />
        </main>
      </div>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminSidebar } from "../components/structure/sidebar";
import { AdminHeader } from "../components/structure/header";
import { MessagingClient } from "@/components/messaging/messaging-client";

export default async function AdminMessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, avatar_url")
    .eq("id", user.id)
    .single() as any;

  if (!profile || profile.role !== "admin") return redirect("/");

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] dark:bg-[#0B0F1A]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <AdminHeader title="Messages" subtitle="Manage conversations with all platform users" />
        <main className="flex-1 overflow-hidden">
          <MessagingClient currentUser={profile} isAdmin={true} />
        </main>
      </div>
    </div>
  );
}

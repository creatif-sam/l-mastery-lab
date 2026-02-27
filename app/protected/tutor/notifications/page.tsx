import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TutorSidebar } from "../components/structure/sidebar";
import { TutorHeader } from "../components/structure/header";
import { TutorNotificationsClient } from "./notifications-client";

export default async function TutorNotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "tutor") return redirect("/");

  const [{ data: notifications }, { data: students }] = await Promise.all([
    supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
    supabase.from("profiles").select("id, full_name").eq("role", "student"),
  ]);

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] dark:bg-[#0B0F1A]">
      <TutorSidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TutorHeader title="Notifications" subtitle="Your notifications and send to students" />
        <main className="flex-1 overflow-y-auto p-6">
          <TutorNotificationsClient
            myNotifications={notifications || []}
            students={students || []}
            authorId={user.id}
          />
        </main>
      </div>
    </div>
  );
}

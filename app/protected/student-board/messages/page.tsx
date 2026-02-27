import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "../components/sidebar";
import { Header } from "../components/header";
import { MessagingClient } from "@/components/messaging/messaging-client";

export default async function StudentMessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, avatar_url")
    .eq("id", user.id)
    .single() as any;

  if (!profile) return redirect("/auth/login");

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] dark:bg-[#0F172A] transition-colors">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden">
          <MessagingClient currentUser={profile} isAdmin={false} />
        </main>
      </div>
    </div>
  );
}

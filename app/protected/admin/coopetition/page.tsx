import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminSidebar } from "../components/structure/sidebar";
import { AdminHeader } from "../components/structure/header";
import { CoopetitionHostClient } from "./coopetition-host-client";

export default async function AdminCoopetitionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") return redirect("/");

  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("id, title, difficulty_level, target_language, questions(id)")
    .order("created_at", { ascending: false });

  const formattedQuizzes = (quizzes ?? []).map((q: any) => ({
    id: q.id,
    title: q.title,
    questionCount: q.questions?.length ?? 0,
    difficulty_level: q.difficulty_level,
    target_language: q.target_language,
  }));

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] dark:bg-[#0B0F1A]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <AdminHeader title="Coopetition" subtitle="Create and manage real-time quiz battles" />
        <main className="flex-1 overflow-y-auto p-6">
          <CoopetitionHostClient
            currentUser={{ id: profile.id, full_name: profile.full_name ?? "Admin", role: "admin" }}
            quizzes={formattedQuizzes}
          />
        </main>
      </div>
    </div>
  );
}

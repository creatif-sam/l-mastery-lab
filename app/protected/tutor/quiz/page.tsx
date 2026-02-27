import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TutorSidebar } from "../components/structure/sidebar";
import { TutorHeader } from "../components/structure/header";
import { TutorQuizClient } from "./quiz-client";

export default async function TutorQuizPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "tutor") return redirect("/");

  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("id, title, description, target_language, difficulty_level, created_at, created_by, questions(id)")
    .order("created_at", { ascending: false });

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] dark:bg-[#0B0F1A]">
      <TutorSidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TutorHeader title="Quizzes" subtitle="Create and manage quizzes for your students" />
        <main className="flex-1 overflow-y-auto p-6">
          <TutorQuizClient
            initialQuizzes={(quizzes ?? []) as any[]}
            currentUserId={user.id}
          />
        </main>
      </div>
    </div>
  );
}

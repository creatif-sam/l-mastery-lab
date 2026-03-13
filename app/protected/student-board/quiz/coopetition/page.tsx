import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "../../components/sidebar";
import { Header } from "../../components/header";
import { QuizTabNav } from "../../components/quiz/quiz-tab-nav";
import { CoopetitionClient } from "./coopetition-client";
import { redirect } from "next/navigation";

export default async function CoopetitionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: profile }, { data: quizzes }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .eq("id", user.id)
      .single(),
    supabase
      .from("quizzes")
      .select("id, title, questions(id)")
      .order("created_at", { ascending: false }),
  ]);

  const formattedQuizzes = (quizzes ?? []).map((q: any) => ({
    id: q.id,
    title: q.title,
    questionCount: Array.isArray(q.questions) ? q.questions.length : 0,
  }));

  return (
    <div className="flex min-h-screen bg-[#F8F9FB] dark:bg-black overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar pb-24">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="space-y-2">
              <h1 className="text-5xl font-black italic tracking-tighter text-[#003366] dark:text-white leading-none">
                THE <span className="text-violet-600">ARENAS.</span>
              </h1>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em]">
                Real-time competitive quiz battles
              </p>
            </div>

            <QuizTabNav />

            <CoopetitionClient
              currentUser={profile ?? { id: user.id, full_name: "Player", avatar_url: null }}
              quizzes={formattedQuizzes}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

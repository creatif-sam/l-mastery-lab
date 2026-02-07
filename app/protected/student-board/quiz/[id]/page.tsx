import { createClient } from "@/lib/supabase/server";
import { ActiveQuiz } from "../../components/quiz/active-quiz";
import { Sidebar } from "../../components/sidebar";
import { Header } from "../../components/header";

// Notice the { params }: { params: { id: string } }
export default async function QuizArena({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  
  // Await params in Next.js 15+
  const { id } = await params;

  const { data: questions } = await supabase
    .from("questions")
    .select("*, options:question_options(*)")
    .eq("quiz_id", id)
    .order("created_at", { ascending: true });

  if (!questions || questions.length === 0) {
    return (
       <div className="flex h-screen items-center justify-center font-black text-slate-400">
          NO QUESTIONS FOUND FOR THIS ARENA ID.
       </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FB] dark:bg-black overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-10">
           <ActiveQuiz questions={questions} />
        </main>
      </div>
    </div>
  );
}
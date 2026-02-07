import { Sidebar } from "../components/sidebar";
import { Header } from "../components/header";
import { createClient } from "@/lib/supabase/server";
import { BookOpen, Zap, Clock, Calendar, Target, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ResultsButton } from "../components/quiz/results-button"; // The component created above

export default async function QuizLibraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch quizzes and the user's attempt data
  const { data: quizzes } = await supabase
    .from("quizzes")
    .select(`
      *,
      attempts:quiz_attempts(
        score,
        completed_at
      )
    `)
    .eq('quiz_attempts.user_id', user?.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex min-h-screen bg-[#F8F9FB] dark:bg-black transition-colors overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar pb-24">
          <div className="max-w-6xl mx-auto space-y-10">
            
            <div className="space-y-2">
              <h1 className="text-5xl font-black italic tracking-tighter text-[#003366] dark:text-white leading-none">
                THE <span className="text-violet-600">ARENAS.</span>
              </h1>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em]">Review performance data and launch modules</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes?.map((quiz) => {
                // Get the most recent attempt for this specific quiz
                const lastAttempt = quiz.attempts?.sort((a: any, b: any) => 
                  new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
                )[0];

                const totalQuestions = 21; 
                const rawScore = lastAttempt?.score || 0;
                const percentage = (rawScore / totalQuestions) * 100;

                let feedback = { label: "", color: "" };
                if (lastAttempt) {
                  if (percentage >= 95) feedback = { label: "Excellent", color: "text-emerald-500" };
                  else if (percentage >= 80) feedback = { label: "Tres Bien", color: "text-blue-500" };
                  else if (percentage >= 70) feedback = { label: "Bien", color: "text-violet-500" };
                  else if (percentage < 50) feedback = { label: "Please try again", color: "text-red-500" };
                  else feedback = { label: "In Progress", color: "text-amber-500" };
                }

                return (
                  <div key={quiz.id} className="group relative">
                    <Link 
                      href={`/protected/student-board/quiz/${quiz.id}`} 
                      className="block bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[2.5rem] p-8 transition-all hover:shadow-2xl hover:shadow-violet-500/10 hover:-translate-y-2"
                    >
                      {/* Floating Status Icon */}
                      <div className="absolute top-8 right-8">
                        {lastAttempt && percentage >= 80 ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : lastAttempt && percentage < 50 ? (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        ) : null}
                      </div>

                      <div className="space-y-6">
                        <div className="w-12 h-12 bg-violet-600/10 rounded-2xl flex items-center justify-center text-violet-600">
                          <BookOpen className="w-6 h-6" />
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                            {quiz.difficulty_level || 'Level 1'}
                          </span>
                          <h3 className="text-xl font-black text-[#003366] dark:text-white uppercase leading-tight group-hover:text-violet-600 transition-colors">
                            {quiz.title}
                          </h3>
                        </div>

                        {/* Performance Section */}
                        <div className="space-y-3">
                          {lastAttempt ? (
                            <>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                                  <Target className="w-3 h-3" />
                                  <span className="text-[10px] font-black uppercase">Result: {rawScore}/{totalQuestions}</span>
                                </div>
                                <span className={cn("text-[10px] font-black uppercase italic tracking-wider", feedback.color)}>
                                  {feedback.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-400">
                                <Calendar className="w-3 h-3" />
                                <span className="text-[10px] font-black uppercase">
                                  Attempted {format(new Date(lastAttempt.completed_at), 'MMM dd, yyyy')}
                                </span>
                              </div>
                              
                              {/* The Interactive Client Component */}
                              <ResultsButton />
                            </>
                          ) : (
                            <div className="py-2 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-2xl text-center">
                              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Arena Unlocked</span>
                            </div>
                          )}
                        </div>

                        {/* Footer Details */}
                        <div className="flex items-center gap-4 pt-4 border-t border-slate-50 dark:border-white/5 text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold">{totalQuestions} Qs</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold">15 Min</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
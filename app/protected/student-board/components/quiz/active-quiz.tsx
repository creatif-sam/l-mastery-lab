"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Send, Trophy, CheckCircle2, XCircle, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function ActiveQuiz({ questions = [] }: { questions: any[] }) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const currentQ = questions[currentIndex];
  const options = currentQ?.options || currentQ?.question_options || [];
  const answeredCount = Object.keys(answers).length;
  const isLast = currentIndex === questions.length - 1;

  const handleOptionSelect = (qId: string, oId: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: oId }));
  };

  const handleComplete = async () => {
    setIsSyncing(true);
    const supabase = createClient();
    let score = 0;
    questions.forEach((q) => {
      const opts = q.options || q.question_options || [];
      const correct = opts.find((o: any) => o.is_correct);
      if (correct && answers[q.id] === correct.id) score++;
    });
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("quiz_attempts").insert({
      user_id: user?.id,
      quiz_id: questions[0]?.quiz_id,
      score,
      metadata: answers,
    });
    setIsFinished(true);
    setIsSyncing(false);
  };

  /* RESULTS SCREEN */
  if (isFinished) {
    const total = questions.length;
    let earned = 0;
    questions.forEach((q) => {
      const opts = q.options || q.question_options || [];
      if (opts.find((o: any) => o.is_correct)?.id === answers[q.id]) earned++;
    });
    const pct = Math.round((earned / total) * 100);
    const grade =
      pct >= 95
        ? { label: "Excellent", color: "text-emerald-600", ring: "ring-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", bar: "bg-emerald-500" }
        : pct >= 80
        ? { label: "Tres Bien", color: "text-blue-600", ring: "ring-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10", bar: "bg-blue-500" }
        : pct >= 70
        ? { label: "Bien", color: "text-violet-600", ring: "ring-violet-400", bg: "bg-violet-50 dark:bg-violet-500/10", bar: "bg-violet-500" }
        : pct >= 50
        ? { label: "Keep Going", color: "text-amber-600", ring: "ring-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10", bar: "bg-amber-500" }
        : { label: "Needs Work", color: "text-red-600", ring: "ring-red-400", bg: "bg-red-50 dark:bg-red-500/10", bar: "bg-red-500" };

    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
          <div className={cn("px-8 py-10 text-center", grade.bg)}>
            <div className={cn("w-20 h-20 rounded-full ring-4 bg-white dark:bg-slate-900 flex items-center justify-center mx-auto mb-5 shadow-lg", grade.ring)}>
              <Trophy className={cn("w-9 h-9", grade.color)} />
            </div>
            <h2 className={cn("text-3xl font-black uppercase tracking-tight mb-1", grade.color)}>{grade.label}</h2>
            <p className="text-slate-500 text-sm font-medium">Quiz Complete</p>
          </div>
          <div className="px-8 py-7 space-y-5">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Final Score</p>
                <p className="text-5xl font-black text-slate-900 dark:text-white">
                  {pct}<span className="text-2xl text-slate-300 dark:text-slate-600">%</span>
                </p>
              </div>
              <p className="text-sm font-semibold text-slate-500 pb-2">{earned} / {total} correct</p>
            </div>
            <div className="bg-slate-100 dark:bg-white/10 h-3 rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full transition-all duration-1000", grade.bar)} style={{ width: `${pct}%` }} />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowReview(!showReview)} className="flex-1 h-11 rounded-xl border-2 border-slate-200 dark:border-white/10 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                {showReview ? "Hide Review" : "Review Answers"}
              </button>
              <button onClick={() => router.push("/protected/student-board/quiz")} className="flex-1 h-11 rounded-xl bg-[#0056D2] hover:bg-[#0041A8] text-white text-sm font-bold transition-colors shadow-md shadow-blue-500/20">
                Back to Arenas
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showReview && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              {questions.map((q, idx) => {
                const opts = q.options || q.question_options || [];
                const correct = opts.find((o: any) => o.is_correct);
                const chosen = opts.find((o: any) => o.id === answers[q.id]);
                const isRight = correct?.id === answers[q.id];
                return (
                  <div key={q.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 p-5 shadow-sm">
                    <div className="flex items-start gap-3 mb-3">
                      <span className={cn("shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white mt-0.5", isRight ? "bg-emerald-500" : "bg-red-500")}>{idx + 1}</span>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-snug">{q.question_text}</p>
                    </div>
                    {chosen && (
                      <div className={cn("flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg", isRight ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400")}>
                        {isRight ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        Your answer: {chosen.option_text}
                      </div>
                    )}
                    {!isRight && correct && (
                      <div className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 mt-2">
                        <CheckCircle2 size={12} /> Correct: {correct.option_text}
                      </div>
                    )}
                    {q.explanation && <p className="text-xs text-slate-400 mt-3 pl-3 border-l-2 border-slate-200 dark:border-white/10 leading-relaxed">{q.explanation}</p>}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  /* QUIZ SCREEN */
  return (
    <div className="min-h-full bg-slate-50 dark:bg-[#0B0F1A] -m-10 pb-10">
      {/* Top progress bar */}
      <div className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-white/5 px-4 md:px-8 py-3 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <div className="flex items-center gap-2">
            <BookOpen size={14} className="text-[#0056D2]" />
            <span className="text-xs font-black uppercase tracking-wider whitespace-nowrap text-slate-500">
              Question <span className="text-[#0056D2]">{currentIndex + 1}</span> of {questions.length}
            </span>
          </div>
          <div className="flex-1 bg-slate-100 dark:bg-white/10 h-2 rounded-full overflow-hidden">
            <div className="h-full bg-[#0056D2] rounded-full transition-all duration-500" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
          </div>
          <span className="text-[10px] font-black text-slate-400 whitespace-nowrap">{answeredCount}/{questions.length} answered</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 flex gap-6">
        {/* Left: Question nav grid */}
        <div className="hidden lg:block w-44 shrink-0">
          <div className="sticky top-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-4 shadow-sm">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Navigate</p>
            <div className="grid grid-cols-5 gap-1.5 mb-4">
              {questions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(i)}
                  className={cn(
                    "h-7 w-full rounded-md text-[10px] font-black transition-all",
                    i === currentIndex ? "bg-[#0056D2] text-white shadow-sm"
                    : answers[q.id] ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                    : "bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10"
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <div className="space-y-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-t border-slate-100 dark:border-white/5 pt-3">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#0056D2]" /> Current</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-100 dark:bg-emerald-500/20" /> Answered</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-slate-100 dark:bg-white/5" /> Unanswered</div>
            </div>
          </div>
        </div>

        {/* Main question card */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.18 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-black text-[#0056D2] bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-full uppercase tracking-widest">
                    Question {currentIndex + 1}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">Multiple Choice</span>
                </div>
                <p className="text-lg md:text-xl font-semibold text-slate-900 dark:text-white leading-snug">
                  {currentQ?.question_text}
                </p>
              </div>

              <div className="p-5 space-y-2.5">
                {options.map((opt: any, oi: number) => {
                  const isSelected = answers[currentQ.id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleOptionSelect(currentQ.id, opt.id)}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-150 group",
                        isSelected
                          ? "border-[#0056D2] bg-[#EFF6FF] dark:bg-[#0056D2]/10"
                          : "border-slate-200 dark:border-white/10 hover:border-[#0056D2]/40 hover:bg-slate-50 dark:hover:bg-slate-800"
                      )}
                    >
                      <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 transition-all",
                        isSelected
                          ? "bg-[#0056D2] text-white shadow-md shadow-blue-500/30"
                          : "bg-slate-100 dark:bg-white/10 text-slate-500 group-hover:bg-[#0056D2]/10 group-hover:text-[#0056D2]"
                      )}>
                        {LETTERS[oi]}
                      </div>
                      <span className={cn("text-sm font-medium leading-snug flex-1", isSelected ? "text-[#0056D2] dark:text-blue-300 font-semibold" : "text-slate-700 dark:text-slate-300")}>
                        {opt.option_text}
                      </span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-[#0056D2] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Mobile dots */}
          <div className="lg:hidden flex items-center justify-center gap-1 mt-4">
            {questions.map((q, i) => (
              <button key={i} onClick={() => setCurrentIndex(i)}
                className={cn("rounded-full transition-all",
                  i === currentIndex ? "w-5 h-2 bg-[#0056D2]"
                  : answers[q.id] ? "w-2 h-2 bg-emerald-400"
                  : "w-2 h-2 bg-slate-200 dark:bg-white/10"
                )}
              />
            ))}
          </div>

          {/* Nav footer */}
          <div className="flex items-center justify-between mt-5">
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-5 h-11 rounded-xl border-2 border-slate-200 dark:border-white/10 text-sm font-bold text-slate-600 dark:text-slate-400 disabled:opacity-30 hover:border-slate-300 dark:hover:border-white/20 transition-colors"
            >
              <ChevronLeft size={16} /> Previous
            </button>
            {isLast ? (
              <button
                onClick={handleComplete}
                disabled={isSyncing}
                className="flex items-center gap-2 px-7 h-11 rounded-xl bg-[#0056D2] hover:bg-[#0041A8] text-white text-sm font-bold transition-colors disabled:opacity-60 shadow-lg shadow-blue-500/20"
              >
                {isSyncing ? "Submitting..." : <><Send size={14} /> Submit Quiz</>}
              </button>
            ) : (
              <button
                onClick={() => setCurrentIndex((i) => i + 1)}
                className="flex items-center gap-2 px-7 h-11 rounded-xl bg-[#0056D2] hover:bg-[#0041A8] text-white text-sm font-bold transition-colors shadow-lg shadow-blue-500/20"
              >
                Next <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, Trophy, Zap, LayoutGrid, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export function ActiveQuiz({ questions = [] }: { questions: any[] }) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const questionsPerPage = 5;
  const totalPages = Math.ceil(questions.length / questionsPerPage);
  const startIndex = currentPage * questionsPerPage;
  const currentQuestions = questions.slice(startIndex, startIndex + questionsPerPage);

  const answeredCount = Object.keys(answers).length;
  const globalProgress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  const handleOptionSelect = (qId: string, oId: string) => {
    setAnswers(prev => ({ ...prev, [qId]: oId }));
  };

  const isPageComplete = currentQuestions.every(q => !!answers[q.id]);

  const handleNextPage = async () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      await handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsSyncing(true);
    const supabase = createClient();
    let score = 0;
    
    questions.forEach(q => {
      const options = q.options || q.question_options || [];
      const correct = options.find((o: any) => o.is_correct);
      if (correct && answers[q.id] === correct.id) score++;
    });

    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("quiz_attempts").insert({
      user_id: user?.id,
      quiz_id: questions[0]?.quiz_id,
      score: score,
      metadata: answers
    });

    setIsFinished(true);
    setIsSyncing(false);
  };

  if (isFinished) {
    const totalQuestions = questions.length;
    let earnedScore = 0;
    questions.forEach(q => {
      const options = q.options || q.question_options || [];
      if (options.find((o: any) => o.is_correct)?.id === answers[q.id]) earnedScore++;
    });

    const percentage = (earnedScore / totalQuestions) * 100;

    // Performance Feedback Logic
    let feedback = { label: "", color: "" };
    if (percentage >= 95) feedback = { label: "Excellent", color: "text-emerald-500" };
    else if (percentage >= 80) feedback = { label: "Très Bien", color: "text-blue-500" };
    else if (percentage >= 70) feedback = { label: "Bien", color: "text-violet-500" };
    else if (percentage < 50) feedback = { label: "Please try again", color: "text-red-500" };
    else feedback = { label: "In Progress", color: "text-amber-500" };

    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-700">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-xl border border-slate-100 dark:border-white/5 text-center transition-colors">
          <div className={cn(
            "w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg transition-all",
            percentage >= 70 ? "bg-emerald-500 shadow-emerald-500/20" : "bg-slate-200 dark:bg-white/10"
          )}>
            <Trophy className="w-10 h-10 text-white" />
          </div>

          <h2 className={cn("text-4xl font-black italic tracking-tighter uppercase leading-none mb-2", feedback.color)}>
            {feedback.label}.
          </h2>
          
          <div className="flex flex-col items-center gap-1">
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">Assessment Final Score</p>
            <p className="text-6xl font-black text-[#003366] dark:text-white italic">
              {earnedScore}<span className="text-slate-200 dark:text-slate-800">/{totalQuestions}</span>
            </p>
          </div>

          {percentage < 50 && (
            <div className="mt-6 flex items-center justify-center gap-2 text-red-500 animate-pulse">
              <AlertCircle className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Recommendation: Review & Retake</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 mt-10 justify-center">
            <Button 
              onClick={() => setShowReview(!showReview)} 
              variant="outline" 
              className="h-14 px-8 rounded-2xl border-slate-200 dark:border-white/10 font-black uppercase text-[10px] tracking-widest transition-all"
            >
              {showReview ? <ChevronUp className="w-3 h-3 mr-2" /> : <ChevronDown className="w-3 h-3 mr-2" />}
              {showReview ? "Hide Analysis" : "Review All Answers"}
            </Button>
            <Button 
              onClick={() => router.push("/protected/student-board/results")} 
              className="h-14 px-8 bg-[#003366] dark:bg-violet-600 hover:bg-violet-700 rounded-2xl font-black uppercase text-[10px] tracking-widest text-white shadow-xl transition-all active:scale-95"
            >
              View Full Report
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {showReview && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              {questions.map((q, idx) => {
                const options = q.options || q.question_options || [];
                const isCorrect = options.find((o: any) => o.id === answers[q.id])?.is_correct;
                return (
                  <div key={q.id} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-white/5 space-y-4 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Item {idx + 1}</span>
                      <span className={cn(
                        "text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-tighter",
                        isCorrect ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                      )}>
                        {isCorrect ? "Validated" : "Incorrect"}
                      </span>
                    </div>
                    <p className="text-lg text-slate-700 dark:text-slate-200 font-medium">{q.question_text}</p>
                    <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border-l-2 border-violet-500 text-xs text-slate-500 dark:text-slate-400">{q.explanation}</div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="flex flex-col items-center gap-4">
        <div className="flex justify-between w-full max-w-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-2">
          <span className="flex items-center gap-2">
            <LayoutGrid className="w-3 h-3 text-violet-600" /> 
            Page {currentPage + 1} / {totalPages}
          </span>
          <span>{answeredCount} / {questions.length} Completed</span>
        </div>
        <div className="w-full max-w-2xl bg-slate-100 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
          <div className="h-full bg-violet-600 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(139,92,246,0.5)]" style={{ width: `${globalProgress}%` }} />
        </div>
      </div>

      <div className="space-y-16">
        {currentQuestions.map((q, idx) => {
          const options = q.options || q.question_options || [];
          return (
            <div key={q.id} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-[#003366] dark:bg-violet-600 text-white flex items-center justify-center text-[10px] font-bold shadow-md">
                  {startIndex + idx + 1}
                </span>
                <p className="text-xl md:text-2xl text-[#003366] dark:text-white font-medium tracking-tight leading-snug">
                  {q.question_text}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {options.map((opt: any) => (
                  <button 
                    key={opt.id} 
                    onClick={() => handleOptionSelect(q.id, opt.id)} 
                    className={cn(
                      "group flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left", 
                      answers[q.id] === opt.id 
                        ? "border-violet-600 bg-violet-600/5 dark:bg-violet-600/10 shadow-md" 
                        : "border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900/50 hover:border-slate-200 dark:hover:border-white/20"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-all", 
                      answers[q.id] === opt.id 
                        ? "bg-violet-600 text-white shadow-lg" 
                        : "bg-slate-50 dark:bg-white/5 text-slate-300 dark:text-slate-600"
                    )}>
                      {answers[q.id] === opt.id ? <CheckCircle2 className="w-4 h-4 animate-in zoom-in" /> : "•"}
                    </div>
                    <span className={cn(
                      "text-sm font-semibold transition-colors", 
                      answers[q.id] === opt.id ? "text-violet-700 dark:text-violet-400" : "text-slate-600 dark:text-slate-300"
                    )}>
                      {opt.option_text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center pt-10 border-t border-slate-100 dark:border-white/5">
        <Button 
          disabled={!isPageComplete || isSyncing} 
          onClick={handleNextPage} 
          className="h-16 px-12 bg-[#003366] dark:bg-violet-600 hover:bg-violet-700 dark:hover:bg-violet-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl active:scale-95 disabled:opacity-30 disabled:grayscale transition-all"
        >
          {isSyncing ? (
            <Zap className="w-4 h-4 animate-pulse" />
          ) : (
            currentPage === totalPages - 1 ? "Finish Assessment" : "Next Page"
          )}
        </Button>
      </div>
    </div>
  );
}
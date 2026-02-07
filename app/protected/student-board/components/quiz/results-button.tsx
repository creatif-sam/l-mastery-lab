"use client";

import Link from "next/link";
import { BarChart3 } from "lucide-react";

export function ResultsButton() {
  return (
    <Link 
      href="/protected/student-board/quiz/results"
      className="mt-2 flex items-center justify-center gap-2 w-full py-3 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-100 dark:border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all group/btn"
    >
      <BarChart3 className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-violet-600 transition-colors" />
      View Full Report
    </Link>
  );
}
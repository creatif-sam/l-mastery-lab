"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Swords, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuizTabNav() {
  const pathname = usePathname();
  const isCoopetition = pathname.includes("/coopetition");

  return (
    <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-1 w-fit">
      <Link
        href="/protected/student-board/quiz"
        className={cn(
          "flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-bold transition-all",
          !isCoopetition
            ? "bg-white dark:bg-slate-900 text-[#003366] dark:text-white shadow-sm"
            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        )}
      >
        <BookOpen size={14} />
        Library
      </Link>
      <Link
        href="/protected/student-board/quiz/coopetition"
        className={cn(
          "flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-bold transition-all",
          isCoopetition
            ? "bg-white dark:bg-slate-900 text-violet-600 shadow-sm"
            : "text-slate-500 hover:text-violet-500"
        )}
      >
        <Swords size={14} />
        Coopetition
      </Link>
    </div>
  );
}

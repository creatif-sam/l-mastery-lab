"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "../components/sidebar";
import { Header } from "../components/header";
import { 
  Play, 
  CheckCircle, 
  Lock, 
  Clock, 
  Layers, 
  Search,
  Filter,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LessonsGridPage() {
  const supabase = createClient();
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, completed: 0 });

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Fetch all lessons with categories and user progress
        const { data, error } = await supabase
          .from("lessons")
          .select(`
            *,
            lesson_categories(name_en, name_fr),
            user_lesson_progress!left(is_completed)
          `)
          .order("order_index", { ascending: true });

        if (error) throw error;

        // 2. Format data and calculate stats
        const formattedLessons = data.map(l => ({
          ...l,
          status: l.user_lesson_progress?.[0]?.is_completed ? "completed" : "available"
        }));

        const completedCount = formattedLessons.filter(l => l.status === "completed").length;
        
        setLessons(formattedLessons);
        setStats({ total: data.length, completed: completedCount });
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const progressPercentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#F9FAFB] dark:bg-[#0F172A]">
      <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] dark:bg-[#0F172A] font-sans transition-colors overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar pb-24">
          <div className="max-w-6xl mx-auto space-y-8">
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-violet-600 uppercase tracking-[0.3em]">60-Day Sprint</span>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase text-balance">Mastery Curriculum</h1>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search modules..." 
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl pl-10 pr-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-violet-500/20 transition-all w-64"
                  />
                </div>
              </div>
            </div>

            {/* 📊 DYNAMIC PROGRESS OVERVIEW */}
            <div className="bg-violet-600 rounded-2xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-violet-500/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-violet-200">Current Progress</p>
                  <p className="text-xl font-black uppercase">{stats.completed} of {stats.total} Modules Mastered</p>
                </div>
              </div>
              <div className="w-full md:w-64 space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase">
                  <span>Completion Rate</span>
                  <span>{progressPercentage}%</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 🧱 DYNAMIC LESSONS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lessons.map((lesson) => (
                <LessonCard key={lesson.id} lesson={lesson} />
              ))}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

function LessonCard({ lesson }: { lesson: any }) {
  const isCompleted = lesson.status === "completed";

  return (
    <Link 
      href={`/protected/student-board/lessons/${lesson.id}`}
      className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm transition-all flex flex-col hover:border-violet-500/50 hover:shadow-md active:scale-[0.98]"
    >
      <div className="flex justify-between items-start mb-6">
        <div className={cn(
          "p-2.5 rounded-xl transition-colors",
          isCompleted ? "bg-emerald-500/10 text-emerald-500" : "bg-violet-500/10 text-violet-600"
        )}>
          {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </div>
      </div>

      <div className="space-y-1 mb-6">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {lesson.lesson_categories?.name_en}
        </span>
        <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none group-hover:text-violet-600 transition-colors">
          {lesson.title_en}
        </h3>
        {/* Juxtaposed Title */}
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
          {lesson.title_fr}
        </p>
      </div>

      <div className="mt-auto pt-4 border-t border-slate-50 dark:border-white/5 flex justify-between items-center">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Clock className="w-3 h-3" />
          <span className="text-[10px] font-black uppercase">{lesson.duration_minutes} min</span>
        </div>
        <span className={cn(
          "text-[9px] font-black uppercase px-2 py-1 rounded-md tracking-widest",
          isCompleted ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-100 dark:bg-white/5 text-slate-500"
        )}>
          {isCompleted ? "Mastered" : "Start"}
        </span>
      </div>
    </Link>
  );
}
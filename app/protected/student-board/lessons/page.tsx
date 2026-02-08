"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "../components/sidebar";
import { Header } from "../components/header";
import { 
  Play, 
  CheckCircle, 
  Clock, 
  Layers, 
  Search,
  Loader2,
  ChevronRight,
  FileText,
  PlayCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LessonsGridPage() {
  const supabase = createClient();
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, completed: 0 });

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("lessons")
          .select(`
            *,
            lesson_categories(name_en, name_fr),
            user_lesson_progress!left(is_completed)
          `)
          .order("order_index", { ascending: true });

        if (error) throw error;

        // --- 🧠 GROUPING LOGIC ---
        // Group lessons by category name (The "Module")
        const grouped = data.reduce((acc: any[], lesson: any) => {
          const categoryName = lesson.lesson_categories?.name_en || "General";
          const categoryNameFr = lesson.lesson_categories?.name_fr || "Général";
          
          let existingModule = acc.find(m => m.name === categoryName);
          
          if (!existingModule) {
            existingModule = { 
              name: categoryName, 
              name_fr: categoryNameFr, 
              lessons: [] 
            };
            acc.push(existingModule);
          }
          
          existingModule.lessons.push({
            ...lesson,
            status: lesson.user_lesson_progress?.[0]?.is_completed ? "completed" : "available"
          });
          
          return acc;
        }, []);

        const completedCount = data.filter(l => l.user_lesson_progress?.[0]?.is_completed).length;
        
        setModules(grouped);
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
          <div className="max-w-6xl mx-auto space-y-12">
            
            {/* HEADER & SEARCH */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-violet-600 uppercase tracking-[0.3em]">60-Day Sprint</span>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Mastery Curriculum</h1>
              </div>

              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search lessons..." 
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl pl-10 pr-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-violet-500/20 transition-all w-64"
                />
              </div>
            </div>

            {/* PROGRESS OVERVIEW */}
            <div className="bg-violet-600 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-violet-500/20">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                  <Layers className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-violet-200">Immersion Statistics</p>
                  <p className="text-2xl font-black uppercase">{stats.completed} of {stats.total} Modules Mastered</p>
                </div>
              </div>
              <div className="w-full md:w-72 space-y-3">
                <div className="flex justify-between text-[11px] font-black uppercase tracking-tighter">
                  <span>Course Completion</span>
                  <span>{progressPercentage}%</span>
                </div>
                <div className="h-3 bg-white/20 rounded-full overflow-hidden p-0.5">
                  <div 
                    className="h-full bg-white transition-all duration-1000 ease-out rounded-full" 
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 📂 MODULES LOOP */}
            <div className="space-y-16">
              {modules.map((module, idx) => (
                <section key={idx} className="space-y-6">
                  {/* Module Title */}
                  <div className="flex items-center gap-4 px-2">
                    <div className="w-10 h-10 rounded-full bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 text-xs font-black">
                      0{idx + 1}
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{module.name}</h2>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">{module.name_fr}</p>
                    </div>
                    <div className="flex-1 h-px bg-slate-100 dark:bg-white/5 ml-4" />
                  </div>

                  {/* Lessons Grid under this Module */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {module.lessons.map((lesson: any) => (
                      <LessonCard key={lesson.id} lesson={lesson} />
                    ))}
                  </div>
                </section>
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
  const isVideo = lesson.content_type === "video";

  return (
    <Link 
      href={`/protected/student-board/lessons/${lesson.id}`}
      className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm transition-all flex flex-col hover:border-violet-500/50 hover:shadow-lg active:scale-[0.98]"
    >
      <div className="flex justify-between items-start mb-6">
        <div className={cn(
          "p-3 rounded-2xl transition-all shadow-sm",
          isCompleted ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-violet-600/10 text-violet-600"
        )}>
          {isCompleted ? <CheckCircle className="w-5 h-5" /> : 
           isVideo ? <PlayCircle className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
        </div>
        <div className="bg-slate-50 dark:bg-white/5 px-2.5 py-1 rounded-lg">
           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">#{lesson.order_index}</span>
        </div>
      </div>

      <div className="space-y-1.5 mb-8">
        <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight group-hover:text-violet-600 transition-colors">
          {lesson.title_en}
        </h3>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight italic">
          {lesson.title_fr}
        </p>
      </div>

      <div className="mt-auto pt-5 border-t border-slate-50 dark:border-white/5 flex justify-between items-center">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-[10px] font-black uppercase tracking-widest">{lesson.duration_minutes} min</span>
        </div>
        
        <div className="flex items-center gap-1 text-violet-600 group-hover:gap-2 transition-all">
          <span className="text-[10px] font-black uppercase tracking-widest">{isCompleted ? "Review" : "Learn"}</span>
          <ChevronRight className="w-3 h-3" />
        </div>
      </div>
    </Link>
  );
}
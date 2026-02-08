"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "../../components/sidebar";
import { Header } from "../../components/header";
import { 
  CheckCircle, 
  BookOpen, 
  ArrowLeft, 
  Languages, 
  Volume2, 
  Loader2 
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LessonPage() {
  const params = useParams();
  const supabase = createClient();
  
  const [lesson, setLesson] = useState<any>(null);
  const [syllabus, setSyllabus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLessonData() {
      try {
        // 1. Fetch current lesson
        const { data: currentLesson, error: lessonError } = await supabase
          .from("lessons")
          .select(`
            *,
            lesson_categories(name_en, name_fr)
          `)
          .eq("id", params.id)
          .single();

        if (lessonError) throw lessonError;

        // 2. Fetch full syllabus for the sidebar
        const { data: allLessons, error: syllabusError } = await supabase
          .from("lessons")
          .select("id, title_en, duration_minutes, order_index")
          .order("order_index", { ascending: true });

        if (syllabusError) throw syllabusError;

        setLesson(currentLesson);
        setSyllabus(allLessons);
      } catch (error) {
        console.error("Error loading lesson:", error);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) fetchLessonData();
  }, [params.id]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#F9FAFB] dark:bg-[#0F172A]">
      <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
    </div>
  );

  if (!lesson) return <div>Lesson not found.</div>;

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] dark:bg-[#0F172A] font-sans transition-colors overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
            
            {/* 📹 LEFT: VIDEO & BILINGUAL SYNOPSIS */}
            <div className="lg:col-span-2 space-y-6">
              <Link href="/protected/student-board/lessons" className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-violet-600 transition-colors uppercase tracking-[0.2em]">
                <ArrowLeft className="w-3 h-3" /> Back to Curriculum
              </Link>

              <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/5 group relative">
                <iframe 
                  src={`https://www.youtube.com/embed/${lesson.video_id}`} 
                  className="w-full h-full" 
                  allowFullScreen 
                />
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 p-6 md:p-10 shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2.5 bg-violet-600/10 rounded-xl">
                    <Volume2 className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-violet-600 uppercase tracking-widest">
                      {lesson.lesson_categories?.name_en}
                    </span>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mt-1">
                      {lesson.title_en}
                    </h1>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative pt-2">
                  <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-slate-100 dark:bg-white/5 -translate-x-1/2" />
                  
                  <div className="space-y-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-emerald-500">English Synopsis</span>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed tracking-tight">
                      {lesson.description_en}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-violet-500">Synthèse Française</span>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 leading-relaxed tracking-tight">
                      {lesson.description_fr}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 📚 RIGHT: CURRICULUM SIDEBAR */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-violet-600" /> Syllabus
                </h3>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm">
                {syllabus.map((item) => (
                  <Link 
                    href={`/protected/student-board/lessons/${item.id}`}
                    key={item.id}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 text-left transition-all border-b last:border-0 border-slate-50 dark:border-white/5",
                      item.id === params.id ? "bg-violet-600/5" : "hover:bg-slate-50 dark:hover:bg-white/5"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0",
                      item.id === params.id ? "bg-violet-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                    )}>
                      {item.order_index < (lesson.order_index) ? <CheckCircle className="w-4 h-4" /> : item.order_index}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-[11px] font-black uppercase tracking-tight truncate",
                        item.id === params.id ? "text-violet-600" : "text-slate-700 dark:text-slate-300"
                      )}>{item.title_en}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{item.duration_minutes} min • Lesson</p>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Mastery CTA */}
              <Link href="/protected/student-board/quiz" className="block bg-violet-600 p-6 rounded-2xl shadow-xl shadow-violet-500/20 relative overflow-hidden group cursor-pointer active:scale-95 transition-all">
                <Languages className="absolute -right-2 -bottom-2 w-20 h-20 text-white/10 -rotate-12 transition-transform group-hover:rotate-0" />
                <p className="text-[10px] font-black text-violet-200 uppercase tracking-widest mb-1">Take the Quiz</p>
                <h4 className="text-sm font-black text-white uppercase tracking-tight">Test your fluency</h4>
              </Link>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
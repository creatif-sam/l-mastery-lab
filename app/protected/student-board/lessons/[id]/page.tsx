"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "../../components/sidebar";
import { Header } from "../../components/header";
import { 
  CheckCircle, 
  BookOpen, 
  ArrowLeft, 
  Volume2, 
  Loader2,
  Trophy,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import dynamic from "next/dynamic";

/** * 1. OFFICIAL DYNAMIC WRAPPER
 * This is the standard fix for Next.js 16/Turbopack.
 * ssr: false ensures the player only loads in the browser context.
 */
const ReactPlayer = dynamic(() => import("react-player"), { 
  ssr: false,
  loading: () => <div className="aspect-video bg-slate-900 animate-pulse rounded-3xl flex items-center justify-center text-slate-500 font-black uppercase text-[10px] tracking-widest">Initializing Video...</div> 
});

export default function LessonPage() {
  const params = useParams();
  const supabase = createClient();
  
  const [lesson, setLesson] = useState<any>(null);
  const [syllabus, setSyllabus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMarkedComplete, setHasMarkedComplete] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    async function fetchLessonData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch current lesson + current user's progress record
        const { data: currentLesson } = await supabase
          .from("lessons")
          .select(`*, lesson_categories(name_en, name_fr), user_lesson_progress!left(is_completed)`)
          .eq("id", params.id)
          .single();

        // Fetch full syllabus for the sidebar navigation
        const { data: allLessons } = await supabase
          .from("lessons")
          .select(`id, title_en, duration_minutes, order_index, user_lesson_progress!left(is_completed)`)
          .order("order_index", { ascending: true });

        setLesson(currentLesson);
        setSyllabus(allLessons || []);
        
        // Safety check for progress array
        const completed = currentLesson?.user_lesson_progress?.some((p: any) => p.is_completed) || false;
        setHasMarkedComplete(completed);
      } catch (error) {
        console.error("Mastery Lab Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    }
    if (params.id) fetchLessonData();
  }, [params.id, supabase]);

  // --- 🎯 MASTERY TRIGGER (Automatic Check at 90%) ---
  const markAsComplete = async () => {
    if (hasMarkedComplete) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !lesson) return;

    const { error } = await supabase
      .from("user_lesson_progress")
      .upsert({ 
        user_id: user.id, 
        lesson_id: lesson.id, 
        is_completed: true,
        last_watched_at: new Date().toISOString()
      }, { onConflict: 'user_id,lesson_id' });

    if (!error) {
      setHasMarkedComplete(true);
      setShowCelebration(true); // Trigger UI Reward
      
      setSyllabus(prev => prev.map(item => 
        item.id === lesson.id 
          ? { ...item, user_lesson_progress: [{ is_completed: true }] } 
          : item
      ));

      // Hide celebration after 4 seconds of dopamine hit
      setTimeout(() => setShowCelebration(false), 4000);
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#F9FAFB] dark:bg-[#0F172A]">
      <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
    </div>
  );

  if (!lesson) return <div className="p-8 text-center font-black uppercase text-slate-400">Lesson ID: {params.id} not found.</div>;

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] dark:bg-[#0F172A] font-sans transition-colors overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <Header />
        
        {/* 🎊 CELEBRATION OVERLAY (Z-Index 100 for maximum impact) */}
        {showCelebration && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none px-4 bg-black/10 backdrop-blur-[2px]">
            <div className="bg-violet-600 text-white px-8 py-6 rounded-3xl shadow-2xl flex flex-col items-center gap-2 animate-in zoom-in duration-300">
              <div className="flex gap-2">
                <Trophy className="w-8 h-8 text-yellow-400 animate-bounce" />
                <Sparkles className="w-8 h-8 text-yellow-200 animate-pulse" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tighter">Mastery Achieved!</h2>
              <p className="text-[10px] font-bold text-violet-200 uppercase tracking-widest leading-none">Lesson Progress: 90% Threshold Hit</p>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
            
            <div className="lg:col-span-2 space-y-6">
              <Link href="/protected/student-board/lessons" className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-violet-600 transition-colors uppercase tracking-[0.2em]">
                <ArrowLeft className="w-3 h-3" /> Back to Curriculum
              </Link>

              {/* 📹 CINEMA MODE VIDEO CONTAINER */}
              <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/5 relative group">
                <ReactPlayer
                  url={`https://www.youtube.com/watch?v=${lesson.video_id}`}
                  width="100%"
                  height="100%"
                  controls={true}
                  onProgress={(state: any) => {
                    // Logic: Automatic Mastery once 90% is consumed
                    if (state.played >= 0.9 && !hasMarkedComplete) {
                      markAsComplete();
                    }
                  }}
                />
              </div>

              {/* JUXTAPOSED BILINGUAL SYNOPSIS */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 p-6 md:p-10 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-violet-600/10 rounded-xl text-violet-600">
                      <Volume2 className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-violet-600 uppercase tracking-widest">
                        {lesson.lesson_categories?.name_en || "General"}
                      </span>
                      <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mt-1">
                        {lesson.title_en}
                      </h1>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative pt-2">
                  <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-slate-100 dark:bg-white/5 -translate-x-1/2" />
                  
                  <div className="space-y-3">
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">English Synopsis</span>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed tracking-tight">
                      {lesson.description_en}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[10px] font-black text-violet-500 uppercase tracking-widest">Synthèse Française</span>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 leading-relaxed tracking-tight">
                      {lesson.description_fr}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 📚 DYNAMIC SIDEBAR SYLLABUS */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-violet-600" /> Syllabus
                </h3>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm">
                {syllabus.map((item) => {
                  const itemComplete = item.user_lesson_progress?.some((p: any) => p.is_completed);
                  return (
                    <Link 
                      href={`/protected/student-board/lessons/${item.id}`}
                      key={item.id}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 text-left transition-all border-b last:border-0 border-slate-50 dark:border-white/5",
                        item.id === params.id ? "bg-violet-600/5" : "hover:bg-slate-50 dark:hover:bg-white/5"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 transition-all shadow-sm",
                        itemComplete ? "bg-emerald-500 text-white" : 
                        item.id === params.id ? "bg-violet-600 text-white" : 
                        "bg-slate-100 dark:bg-slate-800 text-slate-400"
                      )}>
                        {itemComplete ? <CheckCircle className="w-4 h-4" /> : item.order_index}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-[11px] font-black uppercase tracking-tight truncate",
                          item.id === params.id ? "text-violet-600" : "text-slate-700 dark:text-slate-300"
                        )}>{item.title_en}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{item.duration_minutes} min • Mastery Lab</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
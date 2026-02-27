import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TutorSidebar } from "../components/structure/sidebar";
import { TutorHeader } from "../components/structure/header";
import { BookOpen, Play, Users, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function TutorLessonsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single();
  if (!profile || profile.role !== "tutor") return redirect("/");

  const [{ data: lessons }, { data: allStudents }] = await Promise.all([
    supabase.from("lessons").select("id, title, description, language, created_at").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id", { count: "exact" }).eq("role", "student"),
  ]);

  const lessonList = lessons ?? [];
  const studentCount = allStudents?.length ?? 0;

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] dark:bg-[#0B0F1A]">
      <TutorSidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TutorHeader title="Lessons" subtitle={`${lessonList.length} lessons available on the platform`} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
            {[
              { label: "Total Lessons", value: lessonList.length, icon: BookOpen, color: "text-emerald-500", bg: "bg-emerald-500/10" },
              { label: "Enrolled Students", value: studentCount, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
              { label: "Languages", value: [...new Set(lessonList.map((l: any) => l.language).filter(Boolean))].length, icon: Play, color: "text-purple-500", bg: "bg-purple-500/10" },
            ].map((s) => (
              <div key={s.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm p-5 flex items-center gap-4">
                <div className={`w-11 h-11 ${s.bg} rounded-xl flex items-center justify-center`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{s.value}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {lessonList.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 p-16 text-center">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No lessons created yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {lessonList.map((lesson: any) => (
                <Link key={lesson.id} href={`/protected/student-board/lessons/${lesson.id}`}
                  className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-emerald-400 to-teal-500" />
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-sm line-clamp-1">{lesson.title}</h3>
                        {lesson.language && (
                          <span className="inline-block mt-1 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md uppercase tracking-wide">{lesson.language}</span>
                        )}
                      </div>
                      <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                        <Play size={13} className="text-emerald-500 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                    {lesson.description && <p className="text-xs text-slate-500 mt-3 line-clamp-2">{lesson.description}</p>}
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-[10px] text-slate-400">{new Date(lesson.created_at).toLocaleDateString()}</p>
                      <ChevronRight size={12} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

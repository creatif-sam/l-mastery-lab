import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TutorSidebar } from "../components/structure/sidebar";
import { TutorHeader } from "../components/structure/header";
import { AlertTriangle, MessageSquare } from "lucide-react";
import Link from "next/link";
import { TutorStudentsClient } from "./tutor-students-client";

export default async function TutorStudentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role, organization_id").eq("id", user.id).single();
  if (!profile || profile.role !== "tutor") return redirect("/");

  // If not assigned to an org, block access with helpful message
  if (!profile.organization_id) {
    return (
      <div className="flex min-h-screen bg-[#F9FAFB] dark:bg-[#0B0F1A]">
        <TutorSidebar />
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <TutorHeader title="My Students" subtitle="Organization access required" />
          <main className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-10 border border-slate-200 dark:border-white/5 shadow-xl text-center space-y-5">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Not Assigned to an Organization</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  You need to be assigned to an organization before you can view students.
                  Please send a message to the platform admin to get assigned.
                </p>
              </div>
              <Link
                href="/protected/tutor/messages"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-3 rounded-xl transition-colors text-sm"
              >
                <MessageSquare size={16} />
                Message Platform Admin
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const { data: students } = await supabase
    .from("profiles")
    .select("id, full_name, level, xp, target_language, country_residence, avatar_url, updated_at")
    .eq("role", "student")
    .eq("organization_id", profile.organization_id)
    .order("xp", { ascending: false });

  // Other tutors in the same org
  const { data: otherTutors } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, target_language, level, xp")
    .eq("role", "tutor")
    .eq("organization_id", profile.organization_id)
    .neq("id", user.id)
    .order("xp", { ascending: false });

  // Arena (Coopetition) scores for each student in this org
  const studentIds = (students ?? []).map((s: any) => s.id);
  let arenaScoreMap = new Map<string, { topScore: number; battles: number }>();
  if (studentIds.length > 0) {
    const { data: arenaScores } = await supabase
      .from("coopetition_participants")
      .select("user_id, score, coopetition_sessions!inner(status)")
      .in("user_id", studentIds)
      .eq("coopetition_sessions.status", "finished");

    (arenaScores ?? []).forEach((a: any) => {
      const cur = arenaScoreMap.get(a.user_id) ?? { topScore: 0, battles: 0 };
      arenaScoreMap.set(a.user_id, {
        topScore: Math.max(cur.topScore, a.score ?? 0),
        battles: cur.battles + 1,
      });
    });
  }

  const arenaLeaderboard = (students ?? [])
    .filter((s: any) => arenaScoreMap.has(s.id))
    .map((s: any) => ({ ...s, ...arenaScoreMap.get(s.id) }))
    .sort((a: any, b: any) => b.topScore - a.topScore);

  // Quiz attempts for all students in org
  let quizAttempts: any[] = [];
  if (studentIds.length > 0) {
    const { data: attempts } = await supabase
      .from("quiz_attempts")
      .select("id, user_id, score, completed_at, quiz_id, quizzes!inner(title), profiles!inner(full_name, avatar_url)")
      .in("user_id", studentIds)
      .order("completed_at", { ascending: false })
      .limit(200);

    quizAttempts = (attempts ?? []).map((a: any) => ({
      id: a.id,
      user_id: a.user_id,
      user_name: Array.isArray(a.profiles) ? a.profiles[0]?.full_name : a.profiles?.full_name ?? "Unknown",
      avatar_url: Array.isArray(a.profiles) ? a.profiles[0]?.avatar_url : a.profiles?.avatar_url ?? null,
      quiz_id: a.quiz_id,
      quiz_title: Array.isArray(a.quizzes) ? a.quizzes[0]?.title : a.quizzes?.title ?? "—",
      score: a.score ?? 0,
      completed_at: a.completed_at,
    }));
  }

  const quizTitles = [...new Set(quizAttempts.map((a) => a.quiz_title))];

  // Fetch current tutor's name
  const { data: tutorProfile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] dark:bg-[#0B0F1A]">
      <TutorSidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TutorHeader title="My Students" subtitle={`${students?.length ?? 0} students enrolled`} />
        <main className="flex-1 overflow-y-auto p-6">
          <TutorStudentsClient
            students={students ?? []}
            arenaLeaderboard={arenaLeaderboard}
            quizAttempts={quizAttempts}
            quizTitles={quizTitles}
            otherTutors={otherTutors ?? []}
            currentTutorId={user.id}
            currentTutorName={tutorProfile?.full_name ?? "Tutor"}
          />
        </main>
      </div>
    </div>
  );
}

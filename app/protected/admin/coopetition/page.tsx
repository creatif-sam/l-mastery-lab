import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminSidebar } from "../components/structure/sidebar";
import { AdminHeader } from "../components/structure/header";
import { CoopetitionHostClient } from "./coopetition-host-client";
import { Swords, Building2, Users, Trophy } from "lucide-react";

export default async function AdminCoopetitionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") return redirect("/");

  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("id, title, difficulty_level, target_language, questions(id)")
    .order("created_at", { ascending: false });

  const formattedQuizzes = (quizzes ?? []).map((q: any) => ({
    id: q.id,
    title: q.title,
    questionCount: q.questions?.length ?? 0,
    difficulty_level: q.difficulty_level,
    target_language: q.target_language,
  }));

  // ── Arena Scores by Organisation ──────────────────────────
  const { data: organizations } = await supabase
    .from("organizations")
    .select("id, name");

  // For each org, get top arena score per student
  const orgScoreSummaries: Array<{
    orgId: string; orgName: string;
    topScore: number; participants: number; battles: number;
    topStudents: Array<{ name: string; topScore: number; battles: number }>;
  }> = [];

  for (const org of (organizations ?? [])) {
    const { data: orgStudents } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("organization_id", org.id)
      .eq("role", "student");

    if (!orgStudents?.length) continue;

    const studentIds = orgStudents.map((s: any) => s.id);
    const { data: arenaScores } = await supabase
      .from("coopetition_participants")
      .select("user_id, score, coopetition_sessions!inner(status)")
      .in("user_id", studentIds)
      .eq("coopetition_sessions.status", "finished");

    if (!arenaScores?.length) continue;

    const topMap = new Map<string, { topScore: number; battles: number }>();
    arenaScores.forEach((a: any) => {
      const cur = topMap.get(a.user_id) ?? { topScore: 0, battles: 0 };
      topMap.set(a.user_id, { topScore: Math.max(cur.topScore, a.score ?? 0), battles: cur.battles + 1 });
    });

    const topStudents = orgStudents
      .filter((s: any) => topMap.has(s.id))
      .map((s: any) => ({ name: s.full_name, ...topMap.get(s.id)! }))
      .sort((a, b) => b.topScore - a.topScore)
      .slice(0, 5);

    orgScoreSummaries.push({
      orgId: org.id,
      orgName: org.name,
      topScore: Math.max(...topStudents.map((s) => s.topScore)),
      participants: topMap.size,
      battles: arenaScores.length,
      topStudents,
    });
  }

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] dark:bg-[#0B0F1A]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <AdminHeader title="Coopetition" subtitle="Create and manage real-time quiz battles" />
        <main className="flex-1 overflow-y-auto p-6 space-y-8">

          {/* Arena Scores by Organization */}
          {orgScoreSummaries.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Swords className="w-5 h-5 text-rose-500" />
                <h2 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight">Arena Scores by Organisation</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {orgScoreSummaries.map((org) => (
                  <div key={org.orgId} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-black text-slate-800 dark:text-white truncate max-w-[160px]">{org.orgName}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 font-black uppercase">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{org.participants}</span>
                        <span className="flex items-center gap-1"><Swords className="w-3 h-3" />{org.battles}</span>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      {org.topStudents.map((s, idx) => (
                        <div key={s.name} className="flex items-center justify-between py-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black text-slate-400 w-5">
                              {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                            </span>
                            <div className="w-6 h-6 rounded-md bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 text-[9px] font-black">
                              {s.name.charAt(0)}
                            </div>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{s.name}</span>
                          </div>
                          <span className="text-xs font-black text-rose-600 dark:text-rose-400 flex items-center gap-1">
                            <Trophy className="w-3 h-3" />{s.topScore} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <CoopetitionHostClient
            currentUser={{ id: profile.id, full_name: profile.full_name ?? "Admin", role: "admin" }}
            quizzes={formattedQuizzes}
          />
        </main>
      </div>
    </div>
  );
}

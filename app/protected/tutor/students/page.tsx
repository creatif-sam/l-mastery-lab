import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TutorSidebar } from "../components/structure/sidebar";
import { TutorHeader } from "../components/structure/header";
import { Users, Trophy, TrendingUp, BookOpen, AlertTriangle, MessageSquare, Swords, Medal } from "lucide-react";
import Link from "next/link";

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

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] dark:bg-[#0B0F1A]">
      <TutorSidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TutorHeader title="My Students" subtitle={`${students?.length ?? 0} students enrolled`} />
        <main className="flex-1 overflow-y-auto p-6 space-y-5">

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Students", value: students?.length ?? 0, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
              { label: "Top XP", value: students?.[0]?.xp ?? 0, icon: Trophy, color: "text-amber-500", bg: "bg-amber-500/10" },
              { label: "Avg Level", value: students?.length ? Math.round(students.reduce((a, s: any) => a + s.level, 0) / students.length) : 0, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
              { label: "Learning French", value: students?.filter((s: any) => s.target_language === "french" || s.target_language === "both").length ?? 0, icon: BookOpen, color: "text-purple-500", bg: "bg-purple-500/10" },
            ].map((s) => (
              <div key={s.label} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-white/5 shadow-sm">
                <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{s.value}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/5">
                    <th className="text-left text-xs font-bold text-slate-500 uppercase px-5 py-3">Student</th>
                    <th className="text-left text-xs font-bold text-slate-500 uppercase px-5 py-3 hidden md:table-cell">Language</th>
                    <th className="text-left text-xs font-bold text-slate-500 uppercase px-5 py-3">Level / XP</th>
                    <th className="text-left text-xs font-bold text-slate-500 uppercase px-5 py-3 hidden lg:table-cell">Country</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {(students || []).map((s: any, i: number) => (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {s.avatar_url ? (
                            <img src={s.avatar_url} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {s.full_name?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-white">{s.full_name}</p>
                            {i === 0 && <span className="text-[10px] text-amber-500 font-bold">🏆 Top student</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell text-slate-500 capitalize">{s.target_language || "—"}</td>
                      <td className="px-5 py-3">
                        <p className="text-slate-800 dark:text-white font-medium">Lvl {s.level}</p>
                        <p className="text-xs text-slate-400">{s.xp} XP</p>
                      </td>
                      <td className="px-5 py-3 hidden lg:table-cell text-slate-500">{s.country_residence || "—"}</td>
                    </tr>
                  ))}
                  {(!students || students.length === 0) && (
                    <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-400">No students found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ⚔️ ARENA BATTLE SCORES */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Swords className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Arena Battle Scores</h3>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {arenaLeaderboard.length} / {students?.length ?? 0} students participated
              </span>
            </div>
            {arenaLeaderboard.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/5">
                      <th className="text-left text-xs font-bold text-slate-500 uppercase px-5 py-3">Rank</th>
                      <th className="text-left text-xs font-bold text-slate-500 uppercase px-5 py-3">Student</th>
                      <th className="text-left text-xs font-bold text-slate-500 uppercase px-5 py-3">Top Score</th>
                      <th className="text-left text-xs font-bold text-slate-500 uppercase px-5 py-3">Battles</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {arenaLeaderboard.map((s: any, i: number) => (
                      <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-5 py-3">
                          <span className={`text-sm font-black ${i < 3 ? "text-violet-600" : "text-slate-400"}`}>
                            {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            {s.avatar_url ? (
                              <img src={s.avatar_url} alt="" className="w-7 h-7 rounded-lg object-cover" />
                            ) : (
                              <div className="w-7 h-7 bg-rose-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                                {s.full_name?.charAt(0)}
                              </div>
                            )}
                            <span className="font-semibold text-slate-800 dark:text-white">{s.full_name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="font-black text-rose-600 dark:text-rose-400">{s.topScore} pts</span>
                        </td>
                        <td className="px-5 py-3 text-slate-500">{s.battles}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-5 py-10 text-center">
                <Swords className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No arena battles recorded for your students yet</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

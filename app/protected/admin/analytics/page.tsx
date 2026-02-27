import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminSidebar } from "../components/structure/sidebar";
import { AdminHeader } from "../components/structure/header";
import { BarChart2, Globe, Activity, TrendingUp, Users, BookOpen, Trophy, Zap } from "lucide-react";

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return redirect("/");

  const [
    { count: totalUsers },
    { count: totalAttempts },
    { count: completedLessons },
    { data: roleBreakdown },
    { data: languageBreakdown },
    { data: levelBreakdown },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("quiz_attempts").select("*", { count: "exact", head: true }),
    supabase.from("user_lesson_progress").select("*", { count: "exact", head: true }).eq("is_completed", true),
    supabase.from("profiles").select("role"),
    supabase.from("profiles").select("target_language"),
    supabase.from("profiles").select("level"),
  ]);

  const roleCounts = (roleBreakdown || []).reduce((acc: any, u: any) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  const langCounts = (languageBreakdown || []).reduce((acc: any, u: any) => {
    if (u.target_language) acc[u.target_language] = (acc[u.target_language] || 0) + 1;
    return acc;
  }, {});

  const levelBuckets = { "1-5": 0, "6-10": 0, "11-20": 0, "20+": 0 };
  (levelBreakdown || []).forEach((u: any) => {
    if (u.level <= 5) levelBuckets["1-5"]++;
    else if (u.level <= 10) levelBuckets["6-10"]++;
    else if (u.level <= 20) levelBuckets["11-20"]++;
    else levelBuckets["20+"]++;
  });

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] dark:bg-[#0B0F1A]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <AdminHeader title="Analytics" subtitle="Detailed platform insights and performance" />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* KPI Row */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: "Total Users", value: totalUsers ?? 0, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
              { label: "Quiz Attempts", value: totalAttempts ?? 0, icon: Trophy, color: "text-amber-500", bg: "bg-amber-500/10" },
              { label: "Lessons Completed", value: completedLessons ?? 0, icon: BookOpen, color: "text-emerald-500", bg: "bg-emerald-500/10" },
              { label: "Avg XP Gain/Day", value: "142", icon: Zap, color: "text-purple-500", bg: "bg-purple-500/10" },
            ].map((s) => (
              <div key={s.label} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-white/5 shadow-sm">
                <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{s.value}</p>
                <p className="text-xs text-slate-500 font-medium mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Role Breakdown */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm p-5">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4">Users by Role</h3>
              <div className="space-y-3">
                {Object.entries(roleCounts).map(([role, count]: any) => {
                  const total = totalUsers || 1;
                  const pct = Math.round((count / total) * 100);
                  const colors: any = { student: "bg-blue-500", tutor: "bg-emerald-500", admin: "bg-indigo-500" };
                  return (
                    <div key={role}>
                      <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        <span className="capitalize">{role}</span>
                        <span>{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${colors[role] || "bg-slate-400"} rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                {Object.keys(roleCounts).length === 0 && <p className="text-slate-400 text-sm">No data yet</p>}
              </div>
            </div>

            {/* Language Breakdown */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm p-5">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4">Target Languages</h3>
              <div className="space-y-3">
                {Object.entries(langCounts).map(([lang, count]: any) => {
                  const total = totalUsers || 1;
                  const pct = Math.round((count / total) * 100);
                  const colors: any = { french: "bg-blue-500", english: "bg-red-500", both: "bg-purple-500" };
                  return (
                    <div key={lang}>
                      <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        <span className="capitalize">{lang}</span>
                        <span>{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${colors[lang] || "bg-slate-400"} rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                {Object.keys(langCounts).length === 0 && <p className="text-slate-400 text-sm">No data yet</p>}
              </div>
            </div>

            {/* Level Distribution */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm p-5">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4">Level Distribution</h3>
              <div className="space-y-3">
                {Object.entries(levelBuckets).map(([bucket, count]) => {
                  const total = totalUsers || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={bucket}>
                      <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        <span>Levels {bucket}</span>
                        <span>{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Engagement metrics */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 dark:text-white mb-5">Site Traffic & Engagement (Simulated)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Unique Visitors", value: "3,241", delta: "+14%", up: true, icon: Globe },
                { label: "Session Duration", value: "8m 32s", delta: "+4%", up: true, icon: Activity },
                { label: "Bounce Rate", value: "24%", delta: "-8%", up: true, icon: TrendingUp },
                { label: "Conversions", value: "12.4%", delta: "+2%", up: true, icon: BarChart2 },
              ].map((m) => (
                <div key={m.label} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <m.icon size={14} className="text-indigo-500" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{m.label}</span>
                  </div>
                  <p className="text-xl font-black text-slate-900 dark:text-white">{m.value}</p>
                  <p className={`text-xs font-semibold mt-1 ${m.up ? "text-emerald-500" : "text-red-400"}`}>{m.delta} vs last week</p>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}

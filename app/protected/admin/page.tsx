import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminSidebar } from "./components/structure/sidebar";
import { AdminHeader } from "./components/structure/header";
import {
  Users,
  BookOpen,
  Trophy,
  TrendingUp,
  Activity,
  Globe,
  MessageSquare,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  BarChart2,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return redirect("/");

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalUsers },
    { count: totalLessons },
    { count: totalQuizAttempts },
    { data: recentUsers },
    { data: recentBlogs },
    { data: topLearners },
    { count: newUsersThisWeek },
    { count: quizThisWeek },
    { count: pageViewsThisWeek },
    { count: communityPostsTotal },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("lessons").select("*", { count: "exact", head: true }),
    supabase.from("quiz_attempts").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("full_name, role, target_language, level, created_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("blog_posts").select("title, author_id, created_at, status").order("created_at", { ascending: false }).limit(4),
    supabase.from("profiles").select("full_name, xp, level").order("xp", { ascending: false }).limit(5),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
    supabase.from("quiz_attempts").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
    supabase.from("page_views").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
    supabase.from("community_posts").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Total Users", value: totalUsers ?? 0, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10", change: "+12%", up: true },
    { label: "Lessons Published", value: totalLessons ?? 0, icon: BookOpen, color: "text-emerald-500", bg: "bg-emerald-500/10", change: "+3%", up: true },
    { label: "Quiz Attempts", value: totalQuizAttempts ?? 0, icon: Trophy, color: "text-amber-500", bg: "bg-amber-500/10", change: "+28%", up: true },
    { label: "Engagement Rate", value: "73%", icon: Activity, color: "text-purple-500", bg: "bg-purple-500/10", change: "-2%", up: false },
  ];

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] dark:bg-[#0B0F1A] transition-colors">
      <AdminSidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <AdminHeader title="Admin Overview" subtitle="Platform health & key metrics" />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-white/5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center`}>
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <span className={`flex items-center gap-1 text-xs font-semibold ${s.up ? "text-emerald-500" : "text-red-400"}`}>
                    {s.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {s.change}
                  </span>
                </div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{s.value}</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Middle row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/5">
                <h3 className="font-bold text-slate-800 dark:text-white">Recent Registrations</h3>
                <Link href="/protected/admin/users" className="text-indigo-500 text-xs font-semibold hover:underline flex items-center gap-1">
                  View All <ArrowUpRight size={12} />
                </Link>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {(recentUsers || []).map((u: any, i: number) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                        {u.full_name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">{u.full_name}</p>
                        <p className="text-xs text-slate-400">{u.target_language || "—"} · Lvl {u.level}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                      u.role === "admin" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300" :
                      u.role === "tutor" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" :
                      "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400"
                    }`}>{u.role}</span>
                  </div>
                ))}
                {(!recentUsers || recentUsers.length === 0) && (
                  <div className="px-5 py-8 text-center text-slate-400 text-sm">No users yet</div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/5">
                <h3 className="font-bold text-slate-800 dark:text-white">Top Learners</h3>
                <Trophy size={16} className="text-amber-500" />
              </div>
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {(topLearners || []).map((l: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3">
                    <span className={`text-xs font-black w-5 ${i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-orange-600" : "text-slate-500"}`}>#{i + 1}</span>
                    <div className="w-7 h-7 bg-gradient-to-br from-violet-400 to-pink-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                      {l.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">{l.full_name}</p>
                      <p className="text-[10px] text-slate-400">{l.xp} XP · Lvl {l.level}</p>
                    </div>
                  </div>
                ))}
                {(!topLearners || topLearners.length === 0) && (
                  <div className="px-5 py-8 text-center text-slate-400 text-sm">No data yet</div>
                )}
              </div>
            </div>
          </div>

          {/* Engagement stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-slate-800 dark:text-white">Platform Engagement</h3>
                <BarChart2 size={16} className="text-indigo-500" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Page Views (7d)", value: (pageViewsThisWeek ?? 0).toLocaleString(), icon: Globe, color: "text-blue-500" },
                  { label: "New Users (7d)", value: (newUsersThisWeek ?? 0).toLocaleString(), icon: Zap, color: "text-amber-500" },
                  { label: "Quiz Attempts (7d)", value: (quizThisWeek ?? 0).toLocaleString(), icon: Activity, color: "text-emerald-500" },
                  { label: "Community Posts", value: (communityPostsTotal ?? 0).toLocaleString(), icon: MessageSquare, color: "text-purple-500" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-center">
                    <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-2`} />
                    <p className="text-xl font-black text-slate-900 dark:text-white">{stat.value}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm p-5">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { label: "Send Email Campaign", href: "/protected/admin/mail", icon: TrendingUp, color: "bg-indigo-500" },
                  { label: "New Blog Post", href: "/protected/admin/blog", icon: BookOpen, color: "bg-emerald-500" },
                  { label: "Manage Users", href: "/protected/admin/users", icon: Users, color: "bg-purple-500" },
                  { label: "View Analytics", href: "/protected/admin/analytics", icon: BarChart2, color: "bg-amber-500" },
                ].map((action) => (
                  <Link key={action.label} href={action.href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                    <div className={`w-8 h-8 ${action.color} rounded-lg flex items-center justify-center`}>
                      <action.icon size={14} className="text-white" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">{action.label}</span>
                    <ArrowUpRight size={12} className="text-slate-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Blog Posts */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/5">
              <h3 className="font-bold text-slate-800 dark:text-white">Recent Blog Posts</h3>
              <Link href="/protected/admin/blog" className="text-indigo-500 text-xs font-semibold hover:underline flex items-center gap-1">Manage <ArrowUpRight size={12} /></Link>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {(recentBlogs || []).map((post: any, i: number) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg flex items-center justify-center">
                      <BookOpen size={14} className="text-indigo-500" />
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{post.title}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${post.status === "published" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"}`}>{post.status}</span>
                </div>
              ))}
              {(!recentBlogs || recentBlogs.length === 0) && (
                <div className="px-5 py-6 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
                  <CheckCircle2 size={16} className="text-slate-300" />
                  No blog posts yet. <Link href="/protected/admin/blog" className="text-indigo-500 font-medium hover:underline">Create one →</Link>
                </div>
              )}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
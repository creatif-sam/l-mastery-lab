import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TutorSidebar } from "./components/structure/sidebar";
import { TutorHeader } from "./components/structure/header";
import { ArrowUpRight, Users, BookOpen, Trophy, TrendingUp, Star, FileText, Bell } from "lucide-react";
import Link from "next/link";
import { NoOrgBanner } from "./components/no-org-banner";

export default async function TutorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role, full_name, organization_id").eq("id", user.id).single();
  if (!profile || profile.role !== "tutor") return redirect("/");

  const [
    { count: myStudents },
    { data: topStudents },
    { data: recentPosts },
    { count: unreadNotifs },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student")
      .eq("organization_id", profile.organization_id || "00000000-0000-0000-0000-000000000000"),
    supabase.from("profiles").select("full_name, xp, level").eq("role", "student").order("xp", { ascending: false }).limit(5),
    supabase.from("blog_posts").select("id, title, status, created_at").eq("author_id", user.id).order("created_at", { ascending: false }).limit(4),
    supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("is_read", false),
  ]);

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] dark:bg-[#0B0F1A] transition-colors">
      <TutorSidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TutorHeader title="Tutor Dashboard" subtitle={`Welcome back, ${profile.full_name?.split(" ")[0]}`} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 space-y-6">

          {/* No-org warning banner */}
          {!profile.organization_id && <NoOrgBanner />}

          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white">
            <h2 className="text-xl font-black mb-1">Welcome back, {profile.full_name?.split(" ")[0]}! 👋</h2>
            <p className="text-emerald-100 text-sm">You have {unreadNotifs ?? 0} unread notification{(unreadNotifs ?? 0) !== 1 ? "s" : ""} and {myStudents ?? 0} students in your cohort.</p>
            <div className="flex gap-3 mt-4">
              <Link href="/protected/tutor/blog" className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2">
                <FileText size={14} /> Write Post
              </Link>
              <Link href="/protected/tutor/students" className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2">
                <Users size={14} /> My Students
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Students", value: myStudents ?? 0, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
              { label: "Blog Posts", value: recentPosts?.length ?? 0, icon: BookOpen, color: "text-emerald-500", bg: "bg-emerald-500/10" },
              { label: "Notifications", value: unreadNotifs ?? 0, icon: Bell, color: "text-amber-500", bg: "bg-amber-500/10" },
              { label: "Avg. XP", value: topStudents?.length ? Math.round(topStudents.reduce((a, s: any) => a + s.xp, 0) / topStudents.length) : 0, icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-500/10" },
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Students */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/5">
                <h3 className="font-bold text-slate-800 dark:text-white">Top Students</h3>
                <Star size={16} className="text-amber-500" />
              </div>
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {(topStudents || []).map((s: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3">
                    <span className={`text-xs font-black w-5 ${i === 0 ? "text-amber-500" : "text-slate-400"}`}>#{i + 1}</span>
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                      {s.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{s.full_name}</p>
                      <p className="text-xs text-slate-400">{s.xp} XP · Lvl {s.level}</p>
                    </div>
                  </div>
                ))}
                {(!topStudents || topStudents.length === 0) && (
                  <div className="px-5 py-8 text-center text-slate-400 text-sm">No students in your cohort yet</div>
                )}
              </div>
            </div>

            {/* Recent Blog Posts */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/5">
                <h3 className="font-bold text-slate-800 dark:text-white">My Blog Posts</h3>
                <Link href="/protected/tutor/blog" className="text-emerald-500 text-xs font-semibold hover:underline flex items-center gap-1">
                  Manage <ArrowUpRight size={12} />
                </Link>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {(recentPosts || []).map((post: any) => (
                  <div key={post.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg flex items-center justify-center">
                        <BookOpen size={14} className="text-emerald-500" />
                      </div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate max-w-[180px]">{post.title}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${post.status === "published" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" : "bg-amber-100 text-amber-700"}`}>
                      {post.status}
                    </span>
                  </div>
                ))}
                {(!recentPosts || recentPosts.length === 0) && (
                  <div className="px-5 py-8 text-center text-slate-400 text-sm">
                    No posts yet. <Link href="/protected/tutor/blog" className="text-emerald-500 font-medium hover:underline">Write one →</Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Write Blog Post", href: "/protected/tutor/blog", icon: FileText, color: "bg-emerald-500" },
                { label: "View Students", href: "/protected/tutor/students", icon: Users, color: "bg-blue-500" },
                { label: "Manage Lessons", href: "/protected/tutor/lessons", icon: BookOpen, color: "bg-purple-500" },
                { label: "Notifications", href: "/protected/tutor/notifications", icon: Bell, color: "bg-amber-500" },
              ].map((action) => (
                <Link key={action.label} href={action.href}
                  className="flex flex-col items-center gap-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-center group">
                  <div className={`w-10 h-10 ${action.color} rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                    <action.icon size={16} className="text-white" />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
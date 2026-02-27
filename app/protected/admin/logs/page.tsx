import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminSidebar } from "../components/structure/sidebar";
import { AdminHeader } from "../components/structure/header";
import {
  Activity,
  User,
  BookOpen,
  Trophy,
  MessageSquare,
  FileText,
  LogIn,
  LogOut,
  Settings,
  Bell,
  Mail,
  Shield,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const ACTION_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  login:                      { label: "Login",              icon: LogIn,        color: "text-blue-500",    bg: "bg-blue-500/10" },
  logout:                     { label: "Logout",             icon: LogOut,       color: "text-slate-400",   bg: "bg-slate-500/10" },
  sign_up:                    { label: "Sign Up",            icon: User,         color: "text-emerald-500", bg: "bg-emerald-500/10" },
  password_reset:             { label: "Password Reset",     icon: Shield,       color: "text-orange-400",  bg: "bg-orange-400/10" },
  lesson_started:             { label: "Lesson Started",     icon: BookOpen,     color: "text-indigo-400",  bg: "bg-indigo-400/10" },
  lesson_completed:           { label: "Lesson Completed",   icon: BookOpen,     color: "text-emerald-500", bg: "bg-emerald-500/10" },
  quiz_started:               { label: "Quiz Started",       icon: Trophy,       color: "text-amber-400",   bg: "bg-amber-400/10" },
  quiz_submitted:             { label: "Quiz Submitted",     icon: Trophy,       color: "text-amber-500",   bg: "bg-amber-500/10" },
  community_post_created:     { label: "Post Created",       icon: MessageSquare,color: "text-purple-500",  bg: "bg-purple-500/10" },
  community_post_deleted:     { label: "Post Deleted",       icon: MessageSquare,color: "text-red-400",     bg: "bg-red-400/10" },
  community_post_reacted:     { label: "Post Reacted",       icon: MessageSquare,color: "text-pink-400",    bg: "bg-pink-400/10" },
  blog_post_created:          { label: "Blog Created",       icon: FileText,     color: "text-sky-500",     bg: "bg-sky-500/10" },
  blog_post_published:        { label: "Blog Published",     icon: FileText,     color: "text-sky-600",     bg: "bg-sky-600/10" },
  message_sent:               { label: "Message Sent",       icon: MessageSquare,color: "text-teal-500",    bg: "bg-teal-500/10" },
  profile_updated:            { label: "Profile Updated",    icon: User,         color: "text-slate-300",   bg: "bg-slate-400/10" },
  settings_changed:           { label: "Settings Changed",   icon: Settings,     color: "text-slate-400",   bg: "bg-slate-500/10" },
  admin_user_role_changed:    { label: "Role Changed",       icon: Shield,       color: "text-red-500",     bg: "bg-red-500/10" },
  admin_notification_sent:    { label: "Notification Sent",  icon: Bell,         color: "text-yellow-500",  bg: "bg-yellow-500/10" },
  admin_mail_campaign_sent:   { label: "Mail Campaign",      icon: Mail,         color: "text-blue-400",    bg: "bg-blue-400/10" },
};

const FALLBACK: (typeof ACTION_META)[string] = {
  label: "Action",
  icon: Activity,
  color: "text-slate-400",
  bg: "bg-slate-500/10",
};

const ROLE_BADGE: Record<string, string> = {
  admin:   "bg-red-500/15 text-red-400 ring-1 ring-red-500/30",
  tutor:   "bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-500/30",
  student: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30",
};

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; role?: string; page?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return redirect("/");

  const params = await searchParams;
  const PAGE_SIZE = 50;
  const page = Math.max(1, Number(params.page ?? 1));
  const from = (page - 1) * PAGE_SIZE;

  // ── Build query ───────────────────────────────────────────────────────
  let query = supabase
    .from("platform_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (params.action && params.action !== "all") {
    query = query.eq("action", params.action);
  }
  if (params.role && params.role !== "all") {
    query = query.eq("user_role", params.role);
  }

  const { data: logs, count } = await query;

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  // ── Aggregate stats (last 24 h) ───────────────────────────────────────
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [
    { count: todayTotal },
    { count: todayLogins },
    { count: todayLessons },
    { count: todayQuizzes },
  ] = await Promise.all([
    supabase.from("platform_logs").select("*", { count: "exact", head: true }).gte("created_at", oneDayAgo),
    supabase.from("platform_logs").select("*", { count: "exact", head: true }).eq("action", "login").gte("created_at", oneDayAgo),
    supabase.from("platform_logs").select("*", { count: "exact", head: true }).eq("action", "lesson_completed").gte("created_at", oneDayAgo),
    supabase.from("platform_logs").select("*", { count: "exact", head: true }).eq("action", "quiz_submitted").gte("created_at", oneDayAgo),
  ]);

  const kpis = [
    { label: "Events Today",         value: todayTotal   ?? 0, icon: Activity, color: "text-blue-500",    bg: "bg-blue-500/10" },
    { label: "Logins (24 h)",        value: todayLogins  ?? 0, icon: LogIn,    color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Lessons Done (24 h)",  value: todayLessons ?? 0, icon: BookOpen, color: "text-indigo-400",  bg: "bg-indigo-400/10" },
    { label: "Quizzes Taken (24 h)", value: todayQuizzes ?? 0, icon: Trophy,   color: "text-amber-500",   bg: "bg-amber-500/10" },
  ];

  const uniqueActions = Array.from(new Set((logs ?? []).map((l: any) => l.action))).sort();

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] dark:bg-[#0B0F1A]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <AdminHeader title="Platform Logs" subtitle="Full audit trail of every user action" />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">

          {/* KPI row */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {kpis.map((k) => (
              <div key={k.label} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-white/5 shadow-sm">
                <div className={`w-10 h-10 ${k.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <k.icon className={`w-5 h-5 ${k.color}`} />
                </div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{k.value}</p>
                <p className="text-xs text-slate-500 font-medium mt-1">{k.label}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <form method="GET" className="flex flex-wrap gap-3 items-center">
            <select
              name="action"
              defaultValue={params.action ?? "all"}
              className="text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Actions</option>
              {Object.entries(ACTION_META).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>

            <select
              name="role"
              defaultValue={params.role ?? "all"}
              className="text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Roles</option>
              <option value="student">Student</option>
              <option value="tutor">Tutor</option>
              <option value="admin">Admin</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              Filter
            </button>
            <a
              href="/protected/admin/logs"
              className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              Clear
            </a>
            <span className="ml-auto text-xs text-slate-400">
              {count ?? 0} total entries
            </span>
          </form>

          {/* Logs table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-white/5">
                    <th className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wide w-8"></th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wide">User</th>
                    <th className="text-left px-3 py-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Role</th>
                    <th className="text-left px-3 py-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Action</th>
                    <th className="text-left px-3 py-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Details</th>
                    <th className="text-left px-3 py-3 text-xs font-bold text-slate-400 uppercase tracking-wide">IP</th>
                    <th className="text-right px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wide">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-white/[0.03]">
                  {(logs ?? []).length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-slate-400 text-sm">
                        No logs yet. Actions will appear here as users interact with the platform.
                      </td>
                    </tr>
                  )}
                  {(logs ?? []).map((log: any) => {
                    const meta = ACTION_META[log.action] ?? FALLBACK;
                    const Icon = meta.icon;
                    const initial = (log.user_name ?? "?").charAt(0).toUpperCase();
                    const roleBadge = ROLE_BADGE[log.user_role] ?? "bg-slate-500/10 text-slate-400";
                    const entityText = log.entity_label ?? log.entity_id ?? "";
                    return (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                        {/* Icon */}
                        <td className="px-5 py-3">
                          <div className={`w-8 h-8 ${meta.bg} rounded-lg flex items-center justify-center`}>
                            <Icon className={`w-4 h-4 ${meta.color}`} />
                          </div>
                        </td>
                        {/* User */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {initial}
                            </div>
                            <span className="font-medium text-slate-700 dark:text-slate-200 truncate max-w-[140px]">
                              {log.user_name ?? "Unknown"}
                            </span>
                          </div>
                        </td>
                        {/* Role */}
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${roleBadge}`}>
                            {log.user_role ?? "—"}
                          </span>
                        </td>
                        {/* Action */}
                        <td className="px-3 py-3">
                          <span className={`font-semibold ${meta.color}`}>{meta.label}</span>
                        </td>
                        {/* Details */}
                        <td className="px-3 py-3 text-slate-500 dark:text-slate-400 max-w-[200px] truncate">
                          {entityText || (
                            log.metadata && Object.keys(log.metadata).length > 0
                              ? JSON.stringify(log.metadata).slice(0, 60)
                              : "—"
                          )}
                        </td>
                        {/* IP */}
                        <td className="px-3 py-3 text-slate-400 font-mono text-xs">
                          {log.ip_address ?? "—"}
                        </td>
                        {/* When */}
                        <td className="px-5 py-3 text-right text-xs text-slate-400 whitespace-nowrap">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-slate-100 dark:border-white/5 px-5 py-4 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  {page > 1 && (
                    <a
                      href={`/protected/admin/logs?page=${page - 1}${params.action ? `&action=${params.action}` : ""}${params.role ? `&role=${params.role}` : ""}`}
                      className="px-3 py-1.5 text-xs font-semibold border border-slate-200 dark:border-white/10 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                    >
                      Previous
                    </a>
                  )}
                  {page < totalPages && (
                    <a
                      href={`/protected/admin/logs?page=${page + 1}${params.action ? `&action=${params.action}` : ""}${params.role ? `&role=${params.role}` : ""}`}
                      className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Next
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}

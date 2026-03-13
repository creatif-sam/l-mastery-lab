import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminSidebar } from "../components/structure/sidebar";
import { AdminHeader } from "../components/structure/header";
import { SiteConfigForm } from "./site-config-form";
import {
  Settings, Bell, Mail, Shield, Database, Users, GraduationCap,
  Building2, BookOpen, Trophy, FileText, MessageSquare, Activity,
} from "lucide-react";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email, created_at, avatar_url, organization_id")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "admin") return redirect("/");

  // Fetch site config
  const { data: siteConfigRows } = await supabase
    .from("site_config")
    .select("config_key, config_value");
  const siteConfig: Record<string, string | null> = {};
  (siteConfigRows ?? []).forEach((r: any) => { siteConfig[r.config_key] = r.config_value; });

  // Fetch live counts in parallel
  const [
    { count: totalUsers },
    { count: totalTutors },
    { count: totalStudents },
    { count: totalOrgs },
    { count: totalLessons },
    { count: totalQuizzes },
    { count: totalBlogPosts },
    { count: totalMessages },
    { count: totalCommunityPosts },
    { count: totalLogs },
    { count: unreadMessages },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "tutor"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("organizations").select("*", { count: "exact", head: true }),
    supabase.from("lessons").select("*", { count: "exact", head: true }),
    supabase.from("quizzes").select("*", { count: "exact", head: true }),
    supabase.from("blog_posts").select("*", { count: "exact", head: true }),
    supabase.from("messages").select("*", { count: "exact", head: true }),
    supabase.from("community_posts").select("*", { count: "exact", head: true }),
    supabase.from("platform_logs").select("*", { count: "exact", head: true }),
    supabase.from("contact_messages").select("*", { count: "exact", head: true }).eq("status", "unread"),
  ]);

  const joined = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  const sections = [
    {
      title: "Platform Overview",
      icon: Activity,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
      items: [
        { label: "Total Users",       value: (totalUsers ?? 0).toLocaleString(),          desc: "All registered accounts" },
        { label: "Tutors",            value: (totalTutors ?? 0).toLocaleString(),          desc: "Assigned tutor role" },
        { label: "Students",          value: (totalStudents ?? 0).toLocaleString(),        desc: "Assigned student role" },
        { label: "Organisations",     value: (totalOrgs ?? 0).toLocaleString(),            desc: "Active organisations" },
      ],
    },
    {
      title: "Content",
      icon: BookOpen,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      items: [
        { label: "Lessons",           value: (totalLessons ?? 0).toLocaleString(),         desc: "Published & draft lessons" },
        { label: "Quizzes",           value: (totalQuizzes ?? 0).toLocaleString(),         desc: "All quiz modules" },
        { label: "Blog Posts",        value: (totalBlogPosts ?? 0).toLocaleString(),       desc: "Published & draft articles" },
        { label: "Community Posts",   value: (totalCommunityPosts ?? 0).toLocaleString(),  desc: "Student & tutor discussions" },
      ],
    },
    {
      title: "Communication",
      icon: MessageSquare,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      items: [
        { label: "Total Messages",    value: (totalMessages ?? 0).toLocaleString(),        desc: "Inbox messages sent" },
        { label: "Unread Contact Requests", value: (unreadMessages ?? 0).toLocaleString(), desc: "Awaiting admin review" },
        { label: "Mail Provider",     value: "Resend",                                     desc: "Connected via RESEND_API_KEY" },
        { label: "Sender Address",    value: "learning@gen116.com",                        desc: "Verified domain via Resend" },
      ],
    },
    {
      title: "Security & Access",
      icon: Shield,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      items: [
        { label: "Row Level Security",  value: "Enabled",             desc: "All tables protected" },
        { label: "Notifications",       value: "Realtime (Supabase)", desc: "Live push for all users" },
        { label: "Logged-in Admin",     value: profile.full_name,     desc: user.email ?? "" },
        { label: "Admin Since",         value: joined,                desc: "Account creation date" },
      ],
    },
    {
      title: "Database",
      icon: Database,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      items: [
        { label: "Provider",            value: "Supabase",                                  desc: "PostgreSQL with RLS" },
        { label: "Tables",              value: "24",                                        desc: "Public schema tables" },
        { label: "Platform Logs",       value: (totalLogs ?? 0).toLocaleString(),           desc: "Total activity log entries" },
        { label: "Storage Buckets",     value: "uploads, org-logos",                        desc: "Active Supabase storage buckets" },
      ],
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] dark:bg-[#0B0F1A]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <AdminHeader title="Settings" subtitle="Platform configuration and live statistics" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-5">

            {/* Admin identity card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm p-5 flex items-center gap-4">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-200 dark:border-white/10 flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-black flex-shrink-0">
                  {profile.full_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-black text-slate-900 dark:text-white text-lg leading-tight">{profile.full_name}</p>
                <p className="text-sm text-slate-500">{user.email}</p>
                <span className="inline-block mt-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 uppercase tracking-wider">
                  Admin
                </span>
              </div>
              <div className="ml-auto text-right hidden sm:block">
                <p className="text-xs text-slate-400">Member since</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{joined}</p>
              </div>
            </div>

            {/* Dynamic sections */}
            {sections.map((section) => (
              <div
                key={section.title}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden"
              >
                <div className="flex items-center gap-3 p-5 border-b border-slate-100 dark:border-white/5">
                  <div className={`w-9 h-9 ${section.bg} rounded-xl flex items-center justify-center`}>
                    <section.icon className={`w-5 h-5 ${section.color}`} />
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-white">{section.title}</h3>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {section.items.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                      </div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white ml-4 text-right">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Site Config: YouTube onboarding video */}
            <SiteConfigForm currentVideoUrl={siteConfig["onboarding_video_url"] ?? null} />

          </div>
        </main>
      </div>
    </div>
  );
}

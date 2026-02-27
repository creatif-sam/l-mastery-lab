import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminSidebar } from "../components/structure/sidebar";
import { AdminHeader } from "../components/structure/header";
import { Settings, Bell, Mail, Shield, Database } from "lucide-react";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return redirect("/");

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] dark:bg-[#0B0F1A]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <AdminHeader title="Settings" subtitle="Platform configuration and preferences" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-5">

            {[
              {
                title: "Email Configuration",
                icon: Mail,
                color: "text-blue-500",
                bg: "bg-blue-500/10",
                items: [
                  { label: "Mail Provider", value: "Resend", desc: "Connected via RESEND_API_KEY" },
                  { label: "Sender Address", value: "learning@gen116.com", desc: "Verified domain via Resend" },
                ],
              },
              {
                title: "Notification Settings",
                icon: Bell,
                color: "text-amber-500",
                bg: "bg-amber-500/10",
                items: [
                  { label: "Realtime Notifications", value: "Enabled", desc: "Using Supabase realtime" },
                  { label: "Toast Library", value: "Sonner", desc: "Position: top-right" },
                ],
              },
              {
                title: "Security",
                icon: Shield,
                color: "text-emerald-500",
                bg: "bg-emerald-500/10",
                items: [
                  { label: "Row Level Security", value: "Enabled", desc: "All tables protected" },
                  { label: "Admin Role", value: profile.full_name, desc: "You have full access" },
                ],
              },
              {
                title: "Database",
                icon: Database,
                color: "text-purple-500",
                bg: "bg-purple-500/10",
                items: [
                  { label: "Provider", value: "Supabase", desc: "PostgreSQL with RLS" },
                  { label: "Tables", value: "13+", desc: "Custom + auth tables" },
                ],
              },
            ].map((section) => (
              <div key={section.title} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 p-5 border-b border-slate-100 dark:border-white/5">
                  <div className={`w-9 h-9 ${section.bg} rounded-xl flex items-center justify-center`}>
                    <section.icon className={`w-5 h-5 ${section.color}`} />
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-white">{section.title}</h3>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {section.items.map((item) => (
                    <div key={item.label} className="flex items-center justify-between px-5 py-4">
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                      </div>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

          </div>
        </main>
      </div>
    </div>
  );
}

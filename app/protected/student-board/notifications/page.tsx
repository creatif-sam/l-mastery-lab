"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCheck, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Sidebar } from "../components/sidebar";
import { Header } from "../components/header";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  link?: string;
};

export default function StudentNotificationsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });
      setNotifications(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    toast.success("All marked as read");
  };

  const deleteNotif = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const typeColors: any = {
    info: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    success: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    blog: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] dark:bg-[#0F172A] transition-colors font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">Notifications</h1>
          <p className="text-sm text-slate-500 mt-0.5">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-1.5 text-xs font-semibold text-violet-500 hover:text-violet-700 transition-colors">
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => { if (!n.is_read) markRead(n.id); if (n.link) router.push(n.link); }}
              className={`flex items-start gap-3 p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-sm ${!n.is_read ? "bg-violet-50 dark:bg-violet-500/5 border-violet-200 dark:border-violet-500/20" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5"}`}
            >
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 mt-0.5 ${typeColors[n.type] || typeColors.info}`}>
                <Bell size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-semibold ${!n.is_read ? "text-violet-800 dark:text-violet-200" : "text-slate-800 dark:text-white"}`}>{n.title}</p>
                  {!n.is_read && <div className="w-2 h-2 bg-violet-500 rounded-full flex-shrink-0 mt-1.5" />}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                <div className="flex items-center gap-3 mt-2">
                  <p className="text-[10px] text-slate-400">{new Date(n.created_at).toLocaleString()}</p>
                  {n.link && (
                    <span className="text-[10px] text-violet-500 font-medium flex items-center gap-0.5">
                      <ExternalLink size={9} /> View
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteNotif(n.id); }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex-shrink-0"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 text-slate-400">
              <Bell size={40} className="mx-auto mb-3 text-slate-300" />
              <p className="font-medium">No notifications</p>
              <p className="text-sm mt-1">You&apos;re all caught up!</p>
            </div>
          )}
        </div>
      )}
    </div>
        </main>
      </div>
    </div>
  );
}

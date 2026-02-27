"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle, Rss, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
};

const typeIcons: Record<string, React.ReactNode> = {
  success: <CheckCircle size={13} className="text-emerald-500" />,
  warning: <AlertTriangle size={13} className="text-amber-500" />,
  error: <XCircle size={13} className="text-red-500" />,
  blog: <Rss size={13} className="text-violet-500" />,
  info: <Info size={13} className="text-blue-500" />,
};

const typeRing: Record<string, string> = {
  success: "ring-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10",
  warning: "ring-amber-500/30 bg-amber-50 dark:bg-amber-500/10",
  error: "ring-red-500/30 bg-red-50 dark:bg-red-500/10",
  blog: "ring-violet-500/30 bg-violet-50 dark:bg-violet-500/10",
  info: "ring-blue-500/30 bg-blue-50 dark:bg-blue-500/10",
};

interface NotificationDropdownProps {
  /** Extra class names for the bell button wrapper */
  buttonClassName?: string;
  /** Link to full notifications page for "View all" */
  allLink?: string;
}

export function NotificationDropdown({
  buttonClassName = "relative w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors",
  allLink = "/protected/student-board/notifications",
}: NotificationDropdownProps) {
  const supabase = createClient();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // ── Load notifications ──────────────────────────────────────────────────────
  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("id, title, message, type, is_read, link, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setNotifications(data as Notification[]);
  };

  // ── Realtime subscription ───────────────────────────────────────────────────
  useEffect(() => {
    load();
    const subscribe = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const channel = supabase
        .channel(`notif-dropdown:${user.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
          () => load()
        )
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    };
    subscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Close on outside click ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    const ids = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (!ids.length) return;
    await supabase.from("notifications").update({ is_read: true }).in("id", ids);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleClick = (n: Notification) => {
    if (!n.is_read) markRead(n.id);
    if (n.link) router.push(n.link);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* ── Bell button ─────────────────────────────── */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className={buttonClassName}
        aria-label="Notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold leading-none animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown panel ──────────────────────────── */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-[200] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5">
            <div className="flex items-center gap-2">
              <Bell size={13} className="text-slate-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-[10px] font-semibold text-violet-500 hover:text-violet-700 transition-colors"
              >
                <CheckCheck size={11} /> All read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto custom-scrollbar divide-y divide-slate-50 dark:divide-white/5">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell size={20} className="text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left flex items-start gap-3 px-4 py-3 transition-colors group ${
                    !n.is_read
                      ? "bg-violet-50 dark:bg-violet-500/5 hover:bg-violet-100 dark:hover:bg-violet-500/10"
                      : "hover:bg-slate-50 dark:hover:bg-white/5"
                  }`}
                >
                  {/* Icon badge */}
                  <div className={`mt-0.5 w-7 h-7 rounded-lg ring-1 flex items-center justify-center flex-shrink-0 ${typeRing[n.type] || typeRing.info}`}>
                    {typeIcons[n.type] || typeIcons.info}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <p className={`text-xs font-semibold leading-tight ${!n.is_read ? "text-violet-800 dark:text-violet-200" : "text-slate-800 dark:text-white"}`}>
                        {n.title}
                      </p>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!n.is_read && <span className="w-2 h-2 bg-violet-500 rounded-full" />}
                        {n.link && <ExternalLink size={9} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-snug">{n.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 dark:border-white/5 p-2">
            <a
              href={allLink}
              onClick={() => setIsOpen(false)}
              className="block w-full text-center text-[11px] font-semibold text-violet-500 hover:text-violet-700 py-1.5 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors"
            >
              View all notifications →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Bell, Send, Users, UserCheck, User2, Trash2, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
};

type UserProfile = { id: string; full_name: string; role: string };

export function AdminNotificationsClient({
  initialNotifications,
  allUsers,
}: {
  initialNotifications: Notification[];
  allUsers: UserProfile[];
}) {
  const supabase = createClient();
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetGroup, setTargetGroup] = useState<"all" | "students" | "tutors" | "admins">("all");
  const [type, setType] = useState<"info" | "success" | "warning" | "blog">("info");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) { toast.error("Title and message are required"); return; }
    setSending(true);
    let targets = allUsers;
    if (targetGroup !== "all") targets = allUsers.filter((u) => u.role === targetGroup.slice(0, -1));

    const inserts = targets.map((u) => ({
      user_id: u.id,
      title,
      message,
      type,
      is_read: false,
    }));

    const { data, error } = await supabase.from("notifications").insert(inserts).select();
    setSending(false);
    if (error) { toast.error("Failed to send notifications"); return; }
    setNotifications((prev) => [...(data || []), ...prev]);
    toast.success(`Notification sent to ${targets.length} user${targets.length !== 1 ? "s" : ""}!`);
    setTitle("");
    setMessage("");
  };

  const handleDelete = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast.success("Notification deleted");
  };

  const handleMarkAllRead = async () => {
    await supabase.from("notifications").update({ is_read: true }).neq("id", "00000000-0000-0000-0000-000000000000");
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    toast.success("All marked as read");
  };

  const typeColors: any = {
    info: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    success: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    blog: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full">
      {/* Send Notification Panel */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-5">Send Notification</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="Notification title..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none text-slate-700 dark:text-slate-200" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Message</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)}
                rows={3} placeholder="Write your message..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none resize-none text-slate-700 dark:text-slate-200" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Send To</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "all", label: "All Users", icon: Users },
                  { value: "students", label: "Students", icon: User2 },
                  { value: "tutors", label: "Tutors", icon: UserCheck },
                  { value: "admins", label: "Admins", icon: Bell },
                ].map((opt) => (
                  <button key={opt.value} onClick={() => setTargetGroup(opt.value as any)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${targetGroup === opt.value ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300" : "border-slate-200 dark:border-white/5 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                    <opt.icon size={13} /> {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none text-slate-700 dark:text-slate-200">
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="blog">Blog Update</option>
              </select>
            </div>
            <button onClick={handleSend} disabled={sending}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-indigo-500/25 disabled:opacity-50">
              <Send size={14} /> {sending ? "Sending..." : "Send Notification"}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Total Sent", value: notifications.length, color: "text-slate-900 dark:text-white" },
            { label: "Unread", value: notifications.filter(n => !n.is_read).length, color: "text-red-500" },
          ].map((s) => (
            <div key={s.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm p-4 text-center">
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications Log */}
      <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/5">
          <h3 className="font-bold text-slate-800 dark:text-white">Sent Log</h3>
          {notifications.some(n => !n.is_read) && (
            <button onClick={handleMarkAllRead} className="flex items-center gap-1.5 text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition-colors">
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
          {notifications.map((n) => (
            <div key={n.id} className={`flex items-start gap-3 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${!n.is_read ? "bg-indigo-50/50 dark:bg-indigo-500/5" : ""}`}>
              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 mt-0.5 ${typeColors[n.type] || typeColors.info}`}>
                <Bell size={13} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{n.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-[10px] text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {!n.is_read && <div className="w-2 h-2 bg-indigo-500 rounded-full" />}
                <button onClick={() => handleDelete(n.id)} className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="py-16 text-center text-slate-400 text-sm">No notifications sent yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

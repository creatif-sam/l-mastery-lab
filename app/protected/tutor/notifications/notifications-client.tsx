"use client";

import { useState } from "react";
import { Bell, Send, CheckCheck, Trash2, ExternalLink, Users } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  link?: string;
};

type Student = { id: string; full_name: string };

export function TutorNotificationsClient({
  myNotifications,
  students,
  authorId,
}: {
  myNotifications: Notification[];
  students: Student[];
  authorId: string;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(myNotifications);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [sending, setSending] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", authorId);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    toast.success("All marked as read");
  };

  const deleteNotif = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleSendToStudents = async () => {
    if (!title.trim() || !message.trim()) { toast.error("Title and message are required"); return; }
    setSending(true);
    const inserts = students.map((s) => ({ user_id: s.id, title, message, type, is_read: false }));
    const { error } = await supabase.from("notifications").insert(inserts);
    setSending(false);
    if (error) { toast.error("Failed to send notifications"); return; }
    toast.success(`Notification sent to ${students.length} students!`);
    setTitle(""); setMessage("");
  };

  const typeColors: any = {
    info: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    success: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    blog: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Send Panel */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-5">Notify Your Students</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Notification title..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none text-slate-700 dark:text-slate-200" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Message</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Write your message..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none resize-none text-slate-700 dark:text-slate-200" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none text-slate-700 dark:text-slate-200">
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="blog">Blog Update</option>
              </select>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-3 flex items-center gap-2">
              <Users size={14} className="text-emerald-500 flex-shrink-0" />
              <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">Will be sent to all <span className="font-bold">{students.length}</span> students</p>
            </div>
            <button onClick={handleSendToStudents} disabled={sending}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
              <Send size={14} /> {sending ? "Sending..." : "Send to Students"}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 p-4 text-center">
            <p className="text-2xl font-black text-slate-900 dark:text-white">{notifications.length}</p>
            <p className="text-xs text-slate-500 mt-1">My Notifications</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 p-4 text-center">
            <p className="text-2xl font-black text-red-500">{unreadCount}</p>
            <p className="text-xs text-slate-500 mt-1">Unread</p>
          </div>
        </div>
      </div>

      {/* Notifications Feed */}
      <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/5">
          <h3 className="font-bold text-slate-800 dark:text-white">My Notifications</h3>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500 hover:text-emerald-700 transition-colors">
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
          {notifications.map((n) => (
            <div key={n.id}
              onClick={() => { if (!n.is_read) markRead(n.id); if (n.link) router.push(n.link); }}
              className={`flex items-start gap-3 px-5 py-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${!n.is_read ? "bg-emerald-50/50 dark:bg-emerald-500/5" : ""}`}>
              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${typeColors[n.type] || typeColors.info}`}>
                <Bell size={13} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{n.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-[10px] text-slate-400">{new Date(n.created_at).toLocaleString()}</p>
                  {n.link && <span className="text-[10px] text-emerald-500 flex items-center gap-0.5"><ExternalLink size={9} /> View</span>}
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {!n.is_read && <div className="w-2 h-2 bg-emerald-500 rounded-full" />}
                <button onClick={(e) => { e.stopPropagation(); deleteNotif(n.id); }} className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="py-16 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
              <Bell size={32} className="text-slate-300" />
              No notifications yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

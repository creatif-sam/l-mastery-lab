"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "../components/sidebar";
import { Header } from "../components/header";
import { 
  Search, 
  Bell, 
  Sparkles, 
  Loader2, 
  Inbox, 
  ArrowRight, 
  LayoutDashboard, 
  Zap, 
  BookOpen,
  CloudDownload,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function InboxPage() {
  const supabase = createClient();
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMessages() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("receiver_id", user.id)
        .order("created_at", { ascending: false });

      setMessages(data || []);
      setLoading(false);
    }
    fetchMessages();

    const channel = supabase
      .channel("realtime-inbox")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        setMessages((prev) => [payload.new, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  // Handle Google Drive External Access
  const openAcademicArchive = () => {
    const driveUrl = "https://drive.google.com/file/d/1pgB8cIIGFuaxRbRlWtUxhI0yYPBVv-43/view?usp=sharing";
    window.open(driveUrl, "_blank", "noopener,noreferrer");
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#F9FAFB] dark:bg-[#0F172A]">
      <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] dark:bg-[#0F172A] font-sans transition-colors overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        <main className="flex-1 flex overflow-hidden">
          
          {/* --- 📂 ACTIVITY FEED & RESOURCES --- */}
          <aside className={cn(
            "w-full md:w-80 lg:w-96 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/5 flex flex-col transition-all",
            selectedChat ? "hidden md:flex" : "flex"
          )}>
            <div className="p-6 border-b border-slate-50 dark:border-white/5 space-y-4">
              <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Activity Feed</h1>
              
              {/* ☁️ GOOGLE DRIVE ACCESS BUTTON */}
              <button 
                onClick={openAcademicArchive}
                className="w-full flex items-center justify-between p-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-600 rounded-lg group-hover:rotate-12 transition-transform">
                    <CloudDownload className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">Academic Archive</p>
                    <p className="text-xs font-black uppercase truncate tracking-tight">Download Grammaire Progressive</p>
                  </div>
                </div>
                <ExternalLink className="w-3 h-3 opacity-40" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {messages.length > 0 ? (
                messages.map((msg) => (
                  <button 
                    key={msg.id}
                    onClick={() => setSelectedChat(msg)}
                    className={cn(
                      "w-full p-5 flex gap-4 transition-all border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02]",
                      !msg.is_read && "bg-violet-600/[0.03]",
                      selectedChat?.id === msg.id && "bg-violet-600/10 border-l-4 border-l-violet-600"
                    )}
                  >
                    <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/20">
                      {msg.sender_id === '00000000-0000-0000-0000-000000000000' ? <Bell className="text-white w-4 h-4" /> : <Inbox className="text-white w-4 h-4" />}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-[9px] font-black text-violet-600 uppercase tracking-widest mb-1">
                        {msg.sender_id === '00000000-0000-0000-0000-000000000000' ? "System Alert" : "Update"}
                      </p>
                      <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">{msg.content}</p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4 opacity-60">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-400">
                    <Inbox className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none">Inbox is Clear</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed mt-2">
                      Please complete a module or score <br /> in a quiz to see updates.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* --- 🎯 CONTENT DISPLAY AREA --- */}
          <section className={cn(
            "flex-1 flex flex-col bg-[#FDFDFF] dark:bg-[#0B1120] relative",
            !selectedChat ? "hidden md:flex items-center justify-center" : "flex"
          )}>
            {!selectedChat ? (
              <div className="max-w-md w-full p-12 text-center space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="relative inline-block">
                  <div className="w-24 h-24 bg-violet-600/10 rounded-[2.5rem] flex items-center justify-center text-violet-600 animate-pulse">
                    <Zap className="w-10 h-10 fill-violet-600" />
                  </div>
                  <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-amber-500 animate-bounce" />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Everything is Quiet</h2>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                    No new alerts or ranking changes yet. Use the button in the feed to access the Academic Archive.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <Link href="/protected/student-board/lessons" className="w-full py-4 bg-violet-600 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-xl shadow-violet-500/30 hover:bg-violet-700 transition-all flex items-center justify-center gap-2">
                    Start Learning <BookOpen className="w-4 h-4" />
                  </Link>
                  <Link href="/protected/student-board" className="w-full py-4 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest text-xs rounded-xl border border-slate-200 dark:border-white/5 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                    Go to Dashboard <LayoutDashboard className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-8 max-w-2xl mx-auto w-full">
                <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-2xl space-y-6">
                  <div className="w-16 h-16 bg-violet-600 rounded-3xl flex items-center justify-center text-white shadow-xl">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">
                    Event Notification
                  </h2>
                  <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                    <p className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-relaxed italic">
                      "{selectedChat.content}"
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedChat(null)}
                    className="w-full py-4 bg-violet-600 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-violet-500/30 hover:bg-violet-700 transition-all"
                  >
                    Close Notification
                  </button>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
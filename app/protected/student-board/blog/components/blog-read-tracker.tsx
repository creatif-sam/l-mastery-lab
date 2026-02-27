"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function BlogReadTracker({ postId }: { postId: string }) {
  const supabase = createClient();
  const startTime = useRef(Date.now());
  const [alreadyRead, setAlreadyRead] = useState(false);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // check if already read on mount
  useEffect(() => {
    async function checkRead() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("blog_article_reads")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setAlreadyRead(true);
    }
    checkRead();
  }, [postId]);

  // elapsed timer display
  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const handleMarkRead = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Please log in first"); setLoading(false); return; }
    const seconds = Math.floor((Date.now() - startTime.current) / 1000);
    const { error } = await supabase
      .from("blog_article_reads")
      .upsert(
        { post_id: postId, user_id: user.id, time_spent_seconds: seconds, read_at: new Date().toISOString() },
        { onConflict: "post_id,user_id" }
      );
    if (error) { toast.error("Couldn't save progress"); setLoading(false); return; }
    setAlreadyRead(true);
    toast.success("✅ Marked as read! Great job.");
    setLoading(false);
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;

  if (alreadyRead) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm font-bold">
        <CheckCircle2 size={16} />
        Article marked as read
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
        <Clock size={12} />
        Reading time: <span className="font-bold text-slate-600 dark:text-slate-300">{fmt(elapsed)}</span>
      </div>
      <button
        onClick={handleMarkRead}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all active:scale-95"
      >
        <CheckCircle2 size={14} />
        {loading ? "Saving..." : "Mark as Read"}
      </button>
    </div>
  );
}

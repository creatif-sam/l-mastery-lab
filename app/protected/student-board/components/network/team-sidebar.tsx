"use client";

import Image from "next/image";
import { Users, Target, Zap, Mail, UserPlus, TrendingDown, BookOpen, LogOut, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

export function TeamSidebar({ teammates }: { teammates: any[] }) {
  const [leavingGroup, setLeavingGroup] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  async function handleLeaveGroup() {
    if (!confirm("Leave your study group? You can join a new one from the Network page.")) return;
    setLeavingGroup(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ group_id: null })
      .eq("id", user.id);
    if (error) {
      toast.error("Could not leave group. Try again.");
    } else {
      toast.success("You have left the group.");
      router.refresh();
    }
    setLeavingGroup(false);
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden sticky top-8">
      <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-[#003366] dark:text-white">Your Formation</h3>
        <Users className="w-3.5 h-3.5 text-violet-600" />
      </div>

      <div className="p-4 space-y-6">
        {teammates.length > 0 ? (
          <>
            {teammates.map((mate) => {
              const scores = (mate.attempts ?? []).map((a: any) => a.score ?? 0);
              const topScore = scores.length ? Math.max(...scores) : 0;
              const avgScore = scores.length ? Math.round(scores.reduce((s: number, x: number) => s + x, 0) / scores.length) : 0;
              const needsHelp = scores.length >= 2 && avgScore < 50;
              
              return (
                <div key={mate.id} className="space-y-3 group/mate">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-white/5 overflow-hidden relative border border-slate-200 dark:border-white/10">
                      {mate.avatar_url ? (
                        <Image src={mate.avatar_url} alt={mate.full_name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-violet-600 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                          {mate.full_name[0]}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-black text-slate-900 dark:text-white truncate uppercase">{mate.full_name}</p>
                        {needsHelp && (
                          <span title="This teammate may need support" className="flex-shrink-0 flex items-center gap-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded text-[8px] font-black uppercase">
                            <TrendingDown className="w-2.5 h-2.5" /> Help
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[9px] text-emerald-500 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="bg-slate-50 dark:bg-white/5 p-2 rounded-lg border border-slate-100 dark:border-white/5">
                      <div className="flex items-center gap-1 text-slate-400 mb-1">
                        <Target className="w-3 h-3" />
                        <span className="text-[8px] font-black uppercase tracking-tighter">Best</span>
                      </div>
                      <p className="text-sm font-black text-[#003366] dark:text-white italic">{topScore}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-white/5 p-2 rounded-lg border border-slate-100 dark:border-white/5">
                      <div className="flex items-center gap-1 text-slate-400 mb-1">
                        <Zap className="w-3 h-3" />
                        <span className="text-[8px] font-black uppercase tracking-tighter">Runs</span>
                      </div>
                      <p className="text-sm font-black text-violet-600 italic">{mate.attempts?.length || 0}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-white/5 p-2 rounded-lg border border-slate-100 dark:border-white/5">
                      <div className="flex items-center gap-1 text-slate-400 mb-1">
                        <BookOpen className="w-3 h-3" />
                        <span className="text-[8px] font-black uppercase tracking-tighter">Avg</span>
                      </div>
                      <p className={`text-sm font-black italic ${avgScore < 50 ? "text-amber-500" : "text-emerald-500"}`}>{avgScore}</p>
                    </div>
                  </div>

                  {needsHelp && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-lg p-2">
                      <p className="text-[9px] font-bold text-amber-700 dark:text-amber-400 leading-relaxed">
                        💡 <strong>{mate.full_name.split(" ")[0]}</strong> could use a study partner — their average is below 50%. Challenge them to a quiz session!
                      </p>
                    </div>
                  )}

                  <button className="w-full py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-[9px] font-black uppercase tracking-widest opacity-0 group-hover/mate:opacity-100 transition-all flex items-center justify-center gap-2">
                    <Mail className="w-3 h-3" />
                    Message
                  </button>
                </div>
              );
            })}

            {/* Collective intelligence summary */}
            <div className="pt-2 border-t border-slate-100 dark:border-white/5">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Group Intelligence</p>
              <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200/50 dark:border-violet-800/30 rounded-lg p-3">
                <p className="text-[9px] text-violet-700 dark:text-violet-300 leading-relaxed font-medium">
                  Your formation has completed <strong>{teammates.reduce((s, m) => s + (m.attempts?.length ?? 0), 0)} quiz runs</strong> combined. Keep studying together to unlock group bonuses!
                </p>
              </div>
            </div>

            {/* Leave group */}
            <button
              onClick={handleLeaveGroup}
              disabled={leavingGroup}
              className="w-full py-2 border border-red-200 dark:border-red-900/30 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
              {leavingGroup ? <Loader2 className="w-3 h-3 animate-spin" /> : <LogOut className="w-3 h-3" />}
              Leave Formation
            </button>
          </>
        ) : (
          <div className="py-10 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <UserPlus className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 leading-relaxed">Partner up to view collective engagement metrics.</p>
          </div>
        )}
      </div>
    </div>
  );
}
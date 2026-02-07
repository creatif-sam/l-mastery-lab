"use client";

import Image from "next/image";
import { Users, Target, Zap, Mail, UserPlus } from "lucide-react";

export function TeamSidebar({ teammates }: { teammates: any[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden sticky top-8">
      <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-[#003366] dark:text-white">Your Formation</h3>
        <Users className="w-3.5 h-3.5 text-violet-600" />
      </div>

      <div className="p-4 space-y-6">
        {teammates.length > 0 ? (
          teammates.map((mate) => {
            const topScore = mate.attempts?.length 
              ? Math.max(...mate.attempts.map((a: any) => a.score)) 
              : 0;
            
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
                    <p className="text-xs font-black text-slate-900 dark:text-white truncate uppercase">{mate.full_name}</p>
                    <div className="flex items-center gap-1 text-[9px] text-emerald-500 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 dark:bg-white/5 p-2 rounded-lg border border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-1 text-slate-400 mb-1">
                      <Target className="w-3 h-3" />
                      <span className="text-[8px] font-black uppercase tracking-tighter">Best</span>
                    </div>
                    <p className="text-sm font-black text-[#003366] dark:text-white italic">{topScore}<span className="text-[10px] opacity-30">/21</span></p>
                  </div>
                  <div className="bg-slate-50 dark:bg-white/5 p-2 rounded-lg border border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-1 text-slate-400 mb-1">
                      <Zap className="w-3 h-3" />
                      <span className="text-[8px] font-black uppercase tracking-tighter">Runs</span>
                    </div>
                    <p className="text-sm font-black text-violet-600 italic">{mate.attempts?.length || 0}</p>
                  </div>
                </div>

                <button className="w-full py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-[9px] font-black uppercase tracking-widest opacity-0 group-hover/mate:opacity-100 transition-all flex items-center justify-center gap-2">
                  <Mail className="w-3 h-3" />
                  Message
                </button>
              </div>
            );
          })
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
"use client";

import { useState } from "react";
import { Search, Clock, Lock, UserPlus, Zap } from "lucide-react";
import Image from "next/image";
import { formatDistanceToNow, differenceInMinutes } from "date-fns";
import { PartnerButton } from "./partner-button";
import { cn } from "@/lib/utils";

export function SearchableGrid({ members, userId, sentRequests, isMyGroupFull }: any) {
  const [query, setQuery] = useState("");
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  // Filter logic: Match name/role AND check online status if toggled
  const filteredMembers = members.filter((m: any) => {
    const matchesSearch = m.full_name.toLowerCase().includes(query.toLowerCase()) ||
                         (m.role && m.role.toLowerCase().includes(query.toLowerCase()));
    
    // Consider "Active" if updated within the last 10 minutes
    const isActive = m.last_online ? differenceInMinutes(new Date(), new Date(m.last_online)) < 10 : false;
    
    if (showActiveOnly) return matchesSearch && isActive;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* SEARCH & FILTER BAR */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
          <input
            type="text"
            placeholder="Search friends..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all shadow-sm"
          />
        </div>

        <button 
          onClick={() => setShowActiveOnly(!showActiveOnly)}
          className={cn(
            "flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border transition-all font-black text-[10px] uppercase tracking-widest",
            showActiveOnly 
              ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-500 hover:border-emerald-500/50"
          )}
        >
          <Zap className={cn("w-3.5 h-3.5", showActiveOnly ? "fill-white" : "text-emerald-500")} />
          {showActiveOnly ? "Viewing Active" : "Filter Active"}
        </button>
      </div>

      {/* MEMBERS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredMembers.length > 0 ? (
          filteredMembers.map((member: any) => {
            const isMe = member.id === userId;
            const activeRequest = sentRequests?.find((r: any) => r.receiver_id === member.id);
            const minutesAgo = member.last_online ? differenceInMinutes(new Date(), new Date(member.last_online)) : 999;
            const isActive = minutesAgo < 10;
            const onlineStatus = member.last_online
              ? formatDistanceToNow(new Date(member.last_online), { addSuffix: true })
              : "Active";

            return (
              <div key={member.id} className="bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm flex flex-col transition-all">
                <div className="h-10 md:h-12 bg-slate-50 dark:bg-white/5" />
                <div className="px-5 pb-6 -mt-8 flex flex-col items-center">
                  <div className="relative">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white dark:border-slate-800 overflow-hidden bg-slate-100 shadow-sm relative">
                      {member.avatar_url ? (
                        <Image src={member.avatar_url} alt={member.full_name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[#003366] text-white flex items-center justify-center font-bold text-xl uppercase italic">
                          {member.full_name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className={cn(
                      "absolute bottom-1 right-1 w-4 h-4 border-2 border-white dark:border-slate-900 rounded-full",
                      isActive ? "bg-emerald-500" : "bg-slate-300"
                    )} />
                  </div>
                  <h3 className="mt-3 font-black text-sm text-[#003366] dark:text-white uppercase text-center truncate w-full">{member.full_name}</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{member.role || "Specialist"}</p>
                  <div className="mt-4 flex items-center gap-2 text-[8px] text-slate-400 font-black uppercase tracking-tighter bg-slate-50 dark:bg-white/5 px-2 py-1 rounded-md">
                    <Clock className="w-2.5 h-2.5" /> {onlineStatus}
                  </div>
                </div>

                <div className="px-5 pb-5 mt-auto">
                  {!isMe && !member.group_id ? (
                    <PartnerButton receiverId={member.id} initialPendingId={activeRequest?.id} isGroupFull={isMyGroupFull} />
                  ) : isMe ? (
                    <div className="w-full py-2.5 bg-slate-50 dark:bg-white/5 rounded-full text-[10px] font-black uppercase text-slate-300 flex justify-center tracking-widest border border-dashed border-slate-200 dark:border-white/10 italic">Your Profile</div>
                  ) : (
                    <div className="w-full py-2.5 bg-slate-100 dark:bg-white/10 rounded-full text-[10px] font-black uppercase text-slate-400 flex items-center justify-center gap-2 tracking-widest">
                      <Lock className="w-3 h-3" /> In Team
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-100 dark:border-white/5">
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">
              No {showActiveOnly ? "active" : ""} specialists matching your criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";
import { Search, Clock, Lock, Zap, Target, Briefcase, Edit3, X, Check, Loader2 } from "lucide-react";
import Image from "next/image";
import { formatDistanceToNow, differenceInMinutes } from "date-fns";
import { PartnerButton } from "./partner-button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Member {
  id: string;
  full_name: string;
  avatar_url?: string | null;
  role?: string;
  xp?: number;
  level?: number;
  title?: string | null;
  bio?: string | null;
  collaboration_target?: string | null;
  group_id?: string | null;
  last_online?: string | null;
  updated_at?: string | null;
}

interface Props {
  members: Member[];
  userId?: string;
  sentRequests?: Array<{ id: string; receiver_id: string }>;
  isMyGroupFull: boolean;
  myProfile?: Member | null;
}

// ── Inline Profile Edit Modal ────────────────────────────────
function ProfileEditModal({
  profile,
  onClose,
}: {
  profile: Member;
  onClose: () => void;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [title, setTitle] = useState(profile.title ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [target, setTarget] = useState(profile.collaboration_target ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ title: title.trim() || null, bio: bio.trim() || null, collaboration_target: target.trim() || null })
      .eq("id", profile.id);
    setSaving(false);
    if (error) { toast.error("Could not save profile"); return; }
    toast.success("Profile updated!");
    router.refresh();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5">
          <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Edit Your Profile</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Professional Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. French Language Learner | B2 Level"
              maxLength={80}
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell people a bit about yourself and your learning journey..."
              maxLength={300}
              rows={3}
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all resize-none"
            />
            <p className="text-[10px] text-slate-400 text-right mt-0.5">{bio.length}/300</p>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Collaboration Target</label>
            <input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="e.g. Looking for study partner for DELF exam prep"
              maxLength={120}
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all"
            />
          </div>
        </div>
        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export function SearchableGrid({ members, userId, sentRequests, isMyGroupFull, myProfile }: Props) {
  const [query, setQuery] = useState("");
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const filteredMembers = members.filter((m) => {
    const searchStr = `${m.full_name} ${m.role ?? ""} ${m.title ?? ""}`.toLowerCase();
    const matchesSearch = searchStr.includes(query.toLowerCase());
    const activityTime = m.last_online || m.updated_at;
    const isActive = activityTime ? differenceInMinutes(new Date(), new Date(activityTime)) < 10 : false;
    if (showActiveOnly) return matchesSearch && isActive;
    return matchesSearch;
  });

  return (
    <div className="space-y-5">
      {/* SEARCH & FILTER */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, role or title…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all shadow-sm"
          />
        </div>
        <button
          onClick={() => setShowActiveOnly(!showActiveOnly)}
          className={cn(
            "flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border transition-all font-black text-[10px] uppercase tracking-widest whitespace-nowrap",
            showActiveOnly
              ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-500 hover:border-emerald-500/50"
          )}
        >
          <Zap className={cn("w-3.5 h-3.5", showActiveOnly ? "fill-white" : "text-emerald-500")} />
          {showActiveOnly ? "Active Only" : "Filter Active"}
        </button>

        {/* Edit My Profile button */}
        {myProfile && (
          <button
            onClick={() => setEditOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-violet-200 dark:border-violet-700/40 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 font-black text-[10px] uppercase tracking-widest hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-all whitespace-nowrap"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit Profile
          </button>
        )}
      </div>

      {/* MEMBERS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredMembers.length > 0 ? filteredMembers.map((member) => {
          const isMe = member.id === userId;
          const activeRequest = sentRequests?.find((r) => r.receiver_id === member.id);
          const activityTime = member.last_online || member.updated_at;
          const minutesAgo = activityTime ? differenceInMinutes(new Date(), new Date(activityTime)) : 999;
          const isActive = minutesAgo < 10;
          const onlineStatus = activityTime
            ? formatDistanceToNow(new Date(activityTime), { addSuffix: true })
            : "Active";

          return (
            <div
              key={member.id}
              className={cn(
                "bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden shadow-sm flex flex-col transition-all hover:shadow-md",
                isMe
                  ? "border-violet-200 dark:border-violet-700/40"
                  : "border-slate-200 dark:border-white/5"
              )}
            >
              {/* Card Banner */}
              <div className="h-12 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/60 relative">
                <div className={cn(
                  "absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase",
                  isActive
                    ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
                    : "bg-slate-100 dark:bg-white/5 text-slate-400"
                )}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
                  {isActive ? "Active" : "Offline"}
                </div>
              </div>

              {/* Avatar + Name */}
              <div className="px-5 pb-0 -mt-7 flex gap-3 items-end">
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-xl border-2 border-white dark:border-slate-900 overflow-hidden bg-slate-100 shadow-sm">
                    {member.avatar_url ? (
                      <Image src={member.avatar_url} alt={member.full_name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#003366] dark:bg-violet-700 text-white flex items-center justify-center font-black text-lg uppercase italic">
                        {member.full_name.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="pb-2 min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-black text-sm text-slate-900 dark:text-white truncate">{member.full_name}</h3>
                    {isMe && (
                      <span className="flex-shrink-0 text-[8px] font-black bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded uppercase">You</span>
                    )}
                  </div>
                  <p className="text-[10px] text-violet-600 dark:text-violet-400 font-semibold truncate">
                    {member.title || (member.role ? member.role.charAt(0).toUpperCase() + member.role.slice(1) : "Specialist")}
                  </p>
                </div>
              </div>

              {/* Bio */}
              {member.bio && (
                <div className="px-5 pt-2">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{member.bio}</p>
                </div>
              )}

              {/* XP + Level row */}
              <div className="px-5 pt-3 flex items-center gap-3">
                {member.level != null && (
                  <span className="text-[10px] font-black text-slate-400 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 px-2 py-0.5 rounded-md uppercase">
                    Lv.{member.level}
                  </span>
                )}
                {member.xp != null && (
                  <span className="text-[10px] font-black text-amber-500 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-700/20 px-2 py-0.5 rounded-md">
                    {member.xp} XP
                  </span>
                )}
                <div className="ml-auto flex items-center gap-1 text-[9px] text-slate-400">
                  <Clock className="w-2.5 h-2.5" />
                  {onlineStatus}
                </div>
              </div>

              {/* Collaboration Target */}
              {member.collaboration_target && (
                <div className="mx-5 mt-3 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-700/30 rounded-xl flex items-start gap-2">
                  <Target className="w-3 h-3 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-400 leading-relaxed font-medium line-clamp-2">
                    {member.collaboration_target}
                  </p>
                </div>
              )}

              {/* Action Button */}
              <div className="px-5 py-4 mt-auto pt-4">
                {!isMe && !member.group_id ? (
                  <PartnerButton receiverId={member.id} initialPendingId={activeRequest?.id} isGroupFull={isMyGroupFull} />
                ) : isMe ? (
                  <button
                    onClick={() => setEditOpen(true)}
                    className="w-full py-2.5 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700/30 rounded-xl text-[10px] font-black uppercase text-violet-600 dark:text-violet-400 flex items-center justify-center gap-1.5 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors"
                  >
                    <Edit3 className="w-3 h-3" /> Edit your profile
                  </button>
                ) : (
                  <div className="w-full py-2.5 bg-slate-50 dark:bg-white/5 rounded-xl text-[10px] font-black uppercase text-slate-400 flex items-center justify-center gap-1.5 border border-dashed border-slate-200 dark:border-white/10">
                    <Lock className="w-3 h-3" /> In a team
                  </div>
                )}
              </div>
            </div>
          );
        }) : (
          <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-100 dark:border-white/5">
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">
              No {showActiveOnly ? "active " : ""}learners matching your search
            </p>
          </div>
        )}
      </div>

      {/* Profile Edit Modal */}
      {editOpen && myProfile && (
        <ProfileEditModal profile={myProfile} onClose={() => setEditOpen(false)} />
      )}
    </div>
  );
}

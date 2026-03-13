"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Users, Trophy, TrendingUp, BookOpen, Swords, RotateCcw, Loader2,
  GraduationCap, AlertTriangle, Filter, X, Medal,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Student = {
  id: string; full_name: string; level: number; xp: number;
  target_language?: string; country_residence?: string; avatar_url?: string;
  updated_at?: string;
};
type ArenaEntry = Student & { topScore: number; battles: number };
type QuizAttempt = {
  id: string; user_id: string; user_name: string; avatar_url?: string;
  quiz_id: string; quiz_title: string; score: number; completed_at: string;
};
type TutorEntry = {
  id: string; full_name: string; avatar_url?: string; target_language?: string;
  level: number; xp: number;
};

interface Props {
  students: Student[];
  arenaLeaderboard: ArenaEntry[];
  quizAttempts: QuizAttempt[];
  quizTitles: string[];
  otherTutors: TutorEntry[];
  currentTutorId: string;
  currentTutorName: string;
}

export function TutorStudentsClient({
  students,
  arenaLeaderboard: initialArena,
  quizAttempts,
  quizTitles,
  otherTutors,
  currentTutorId,
  currentTutorName,
}: Props) {
  const supabase = createClient();
  const [tab, setTab] = useState<"students" | "scores" | "arena" | "tutors">("students");
  const [arenaLeaderboard, setArenaLeaderboard] = useState(initialArena);
  const [resetingUserId, setResetingUserId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState<{ userId: string; userName: string; type: "quiz" | "arena" } | null>(null);

  // Filters for scores tab
  const [quizFilter, setQuizFilter] = useState("all");
  const [langFilter, setLangFilter] = useState("all");

  const statsCards = [
    { label: "Total Students", value: students.length, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Top XP", value: students[0]?.xp ?? 0, icon: Trophy, color: "text-amber-500", bg: "bg-amber-500/10" },
    {
      label: "Avg Level",
      value: students.length ? Math.round(students.reduce((a, s) => a + s.level, 0) / students.length) : 0,
      icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10",
    },
    {
      label: "French Learners",
      value: students.filter((s) => s.target_language === "french" || s.target_language === "both").length,
      icon: BookOpen, color: "text-purple-500", bg: "bg-purple-500/10",
    },
  ];

  const filteredAttempts = quizAttempts.filter((a) => {
    const quizOk = quizFilter === "all" || a.quiz_title === quizFilter;
    return quizOk;
  });

  const handleResetArenaScore = async (userId: string, userName: string) => {
    setResetingUserId(userId);
    try {
      // Find finished sessions for this user
      const { data: sessions } = await supabase
        .from("coopetition_participants")
        .select("session_id, score")
        .eq("user_id", userId);

      const topScore = sessions ? Math.max(...sessions.map((s: any) => s.score ?? 0), 0) : 0;

      // Archive
      await supabase.from("score_archives").insert({
        archived_by: currentTutorId,
        archived_by_name: currentTutorName,
        user_id: userId,
        user_name: userName,
        score_type: "arena",
        original_score: topScore,
        metadata: { reset_by: "tutor" },
      });

      // Reset scores
      await supabase
        .from("coopetition_participants")
        .update({ score: 0 })
        .eq("user_id", userId);

      setArenaLeaderboard((prev) =>
        prev.map((e) => e.id === userId ? { ...e, topScore: 0 } : e)
      );
      toast.success(`Arena scores reset for ${userName}`);
    } catch {
      toast.error("Failed to reset scores");
    } finally {
      setResetingUserId(null);
      setConfirmReset(null);
    }
  };

  const handleResetQuizScore = async (userId: string, userName: string, attemptId: string, quizTitle: string, score: number) => {
    setResetingUserId(userId);
    try {
      await supabase.from("score_archives").insert({
        archived_by: currentTutorId,
        archived_by_name: currentTutorName,
        user_id: userId,
        user_name: userName,
        score_type: "quiz",
        quiz_title: quizTitle,
        original_score: score,
        metadata: { attempt_id: attemptId, reset_by: "tutor" },
      });

      await supabase.from("quiz_attempts").update({ score: 0 }).eq("id", attemptId);
      toast.success(`Quiz score reset for ${userName}`);
    } catch {
      toast.error("Failed to reset score");
    } finally {
      setResetingUserId(null);
      setConfirmReset(null);
    }
  };

  const tabs = [
    { key: "students", label: "Students", count: students.length },
    { key: "scores", label: "Quiz Scores", count: quizAttempts.length },
    { key: "arena", label: "Arena", count: arenaLeaderboard.length },
    { key: "tutors", label: "Tutors", count: otherTutors.length },
  ] as const;

  return (
    <div className="space-y-5">
      {/* Confirm reset modal */}
      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white">Reset {confirmReset.type === "quiz" ? "Quiz" : "Arena"} Score?</h3>
                <p className="text-xs text-slate-500">This will archive the score, then reset it to 0.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Reset scores for <span className="font-bold text-slate-800 dark:text-white">{confirmReset.userName}</span>?
              The original score will be saved in the admin archives.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmReset(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmReset.type === "arena") {
                    handleResetArenaScore(confirmReset.userId, confirmReset.userName);
                  }
                }}
                disabled={!!resetingUserId}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2"
              >
                {resetingUserId ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                Reset & Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsCards.map((s) => (
          <div key={s.label} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-white/5 shadow-sm">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-1 gap-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide whitespace-nowrap transition-all flex-1 justify-center",
              tab === t.key
                ? "bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            {t.label}
            <span className={cn(
              "text-[9px] px-1.5 py-0.5 rounded-full font-black",
              tab === t.key ? "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400" : "bg-slate-200 dark:bg-slate-700 text-slate-500"
            )}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Students Tab ──────────────────────────────── */}
      {tab === "students" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/5">
                  <th className="text-left text-xs font-bold text-slate-500 uppercase px-5 py-3">Student</th>
                  <th className="text-left text-xs font-bold text-slate-500 uppercase px-5 py-3 hidden md:table-cell">Language</th>
                  <th className="text-left text-xs font-bold text-slate-500 uppercase px-5 py-3">Level / XP</th>
                  <th className="text-left text-xs font-bold text-slate-500 uppercase px-5 py-3 hidden lg:table-cell">Country</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {students.map((s, i) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {s.avatar_url ? (
                          <img src={s.avatar_url} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {s.full_name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-white">{s.full_name}</p>
                          {i === 0 && <span className="text-[10px] text-amber-500 font-bold">🏆 Top student</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell text-slate-500 capitalize">{s.target_language || "—"}</td>
                    <td className="px-5 py-3">
                      <p className="text-slate-800 dark:text-white font-medium">Lvl {s.level}</p>
                      <p className="text-xs text-slate-400">{s.xp} XP</p>
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell text-slate-500">{(s as any).country_residence || "—"}</td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-400">No students found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Quiz Scores Tab ───────────────────────────── */}
      {tab === "scores" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={quizFilter}
                onChange={(e) => setQuizFilter(e.target.value)}
                className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-transparent focus:outline-none"
              >
                <option value="all">All Quizzes</option>
                {quizTitles.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {quizFilter !== "all" && (
              <button onClick={() => setQuizFilter("all")} className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 transition-colors">
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/5">
                    <th className="text-left text-xs font-bold text-slate-500 uppercase px-5 py-3">Student</th>
                    <th className="text-left text-xs font-bold text-slate-500 uppercase px-5 py-3">Quiz</th>
                    <th className="text-left text-xs font-bold text-slate-500 uppercase px-5 py-3">Score</th>
                    <th className="text-left text-xs font-bold text-slate-500 uppercase px-5 py-3 hidden md:table-cell">Date</th>
                    <th className="text-left text-xs font-bold text-slate-500 uppercase px-5 py-3">Reset</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {filteredAttempts.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {a.avatar_url ? (
                            <img src={a.avatar_url} alt="" className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-7 h-7 bg-violet-500 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {a.user_name?.charAt(0)}
                            </div>
                          )}
                          <span className="font-semibold text-slate-800 dark:text-white">{a.user_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{a.quiz_title}</td>
                      <td className="px-5 py-3">
                        <span className="font-black text-violet-600 dark:text-violet-400">{a.score} pts</span>
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell text-slate-500 text-xs">
                        {a.completed_at ? new Date(a.completed_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => handleResetQuizScore(a.user_id, a.user_name, a.id, a.quiz_title, a.score)}
                          disabled={resetingUserId === a.user_id}
                          className="flex items-center gap-1 text-[10px] font-bold text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                          title="Reset this score"
                        >
                          {resetingUserId === a.user_id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3 h-3" />
                          )}
                          Reset
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredAttempts.length === 0 && (
                    <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">No quiz scores found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Arena Tab ─────────────────────────────────── */}
      {tab === "arena" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Swords className="w-4 h-4 text-rose-500" />
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Arena Battle Scores</h3>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {arenaLeaderboard.length} / {students.length} participated
            </span>
          </div>
          {arenaLeaderboard.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/5">
                    <th className="text-left text-xs font-bold text-slate-500 uppercase px-5 py-3">Rank</th>
                    <th className="text-left text-xs font-bold text-slate-500 uppercase px-5 py-3">Student</th>
                    <th className="text-left text-xs font-bold text-slate-500 uppercase px-5 py-3">Top Score</th>
                    <th className="text-left text-xs font-bold text-slate-500 uppercase px-5 py-3">Battles</th>
                    <th className="text-left text-xs font-bold text-slate-500 uppercase px-5 py-3">Reset</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {arenaLeaderboard.map((s, i) => (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3">
                        <span className={`text-sm font-black ${i < 3 ? "text-violet-600" : "text-slate-400"}`}>
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {s.avatar_url ? (
                            <img src={s.avatar_url} alt="" className="w-7 h-7 rounded-lg object-cover" />
                          ) : (
                            <div className="w-7 h-7 bg-rose-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                              {s.full_name?.charAt(0)}
                            </div>
                          )}
                          <span className="font-semibold text-slate-800 dark:text-white">{s.full_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-black text-rose-600 dark:text-rose-400">{s.topScore} pts</span>
                      </td>
                      <td className="px-5 py-3 text-slate-500">{s.battles}</td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => setConfirmReset({ userId: s.id, userName: s.full_name, type: "arena" })}
                          disabled={!!resetingUserId}
                          className="flex items-center gap-1 text-[10px] font-bold text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Reset
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-5 py-10 text-center">
              <Swords className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No arena battles recorded yet</p>
            </div>
          )}
        </div>
      )}

      {/* ── Tutors Tab ────────────────────────────────── */}
      {tab === "tutors" && (
        <div className="space-y-4">
          {otherTutors.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherTutors.map((t) => (
                <div key={t.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
                  <div className="h-16 bg-gradient-to-r from-blue-100 to-indigo-50 dark:from-slate-800 dark:to-slate-700" />
                  <div className="px-5 -mt-7 pb-5">
                    <div className="flex items-end gap-3 mb-3">
                      <div className="w-14 h-14 rounded-xl border-2 border-white dark:border-slate-900 overflow-hidden bg-blue-100 shadow-sm flex-shrink-0">
                        {t.avatar_url ? (
                          <img src={t.avatar_url} alt={t.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center font-black text-xl">
                            {t.full_name?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="pb-1">
                        <GraduationCap className="w-3 h-3 text-blue-500 mb-0.5" />
                        <p className="text-[9px] text-blue-500 font-black uppercase tracking-widest">Tutor</p>
                      </div>
                    </div>
                    <h3 className="font-black text-sm text-slate-900 dark:text-white">{t.full_name}</h3>
                    {t.target_language && (
                      <p className="text-xs text-slate-500 capitalize mt-0.5">{t.target_language}</p>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-[10px] font-black text-slate-400 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 px-2 py-0.5 rounded-md uppercase">
                        Lv.{t.level}
                      </span>
                      <span className="text-[10px] font-black text-amber-500 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-700/20 px-2 py-0.5 rounded-md">
                        {t.xp} XP
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 p-12 text-center shadow-sm">
              <GraduationCap className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="font-bold text-slate-500">No other tutors in your organization</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

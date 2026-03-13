"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Archive,
  Search,
  Trophy,
  Swords,
  RotateCcw,
  Filter,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  BookOpen,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface ArchiveRecord {
  id: string;
  archived_at: string;
  archived_by: string;
  archived_by_name: string | null;
  user_id: string;
  user_name: string | null;
  score_type: "quiz" | "arena" | "all";
  quiz_id: string | null;
  quiz_title: string | null;
  session_id: string | null;
  original_score: number;
  metadata: Record<string, unknown> | null;
}

interface Props {
  archives: ArchiveRecord[];
  totalCount: number;
  quizCount: number;
  arenaCount: number;
  allCount: number;
  totalPages: number;
  currentPage: number;
  currentType: string;
  currentSearch: string;
}

const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  quiz:  { label: "Quiz Reset",   icon: BookOpen, color: "text-indigo-400",  bg: "bg-indigo-500/10" },
  arena: { label: "Arena Reset",  icon: Swords,   color: "text-amber-400",   bg: "bg-amber-500/10" },
  all:   { label: "Full Reset",   icon: RotateCcw, color: "text-red-400",    bg: "bg-red-500/10" },
};

export default function ArchivesClient({
  archives,
  totalCount,
  quizCount,
  arenaCount,
  allCount,
  totalPages,
  currentPage,
  currentType,
  currentSearch,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(currentSearch);

  function pushParams(overrides: Record<string, string>) {
    const sp = new URLSearchParams();
    const merged = {
      type: currentType,
      search: currentSearch,
      page: String(currentPage),
      ...overrides,
    };
    Object.entries(merged).forEach(([k, v]) => {
      if (v && v !== "all" && v !== "" && v !== "1") sp.set(k, v);
    });
    startTransition(() => {
      router.push(`${pathname}${sp.toString() ? "?" + sp.toString() : ""}`);
    });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    pushParams({ search, page: "1" });
  }

  const kpis = [
    { label: "Total Archives",  value: totalCount, icon: Archive,  color: "text-slate-400",  bg: "bg-slate-500/10" },
    { label: "Quiz Resets",     value: quizCount,  icon: BookOpen, color: "text-indigo-400", bg: "bg-indigo-500/10" },
    { label: "Arena Resets",    value: arenaCount, icon: Swords,   color: "text-amber-400",  bg: "bg-amber-500/10" },
    { label: "Full Resets",     value: allCount,   icon: RotateCcw, color: "text-red-400",   bg: "bg-red-500/10" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-white/5 shadow-sm"
          >
            <div className={`w-10 h-10 ${k.bg} rounded-xl flex items-center justify-center mb-3`}>
              <k.icon className={`w-5 h-5 ${k.color}`} />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{k.value}</p>
            <p className="text-xs text-slate-500 font-medium mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-slate-400 shrink-0" />

        {/* Type filter */}
        <div className="flex gap-2 flex-wrap">
          {["all", "quiz", "arena"].map((t) => (
            <button
              key={t}
              onClick={() => pushParams({ type: t, page: "1" })}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                currentType === t || (t === "all" && !currentType)
                  ? "bg-violet-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {t === "all" ? "All Types" : t === "quiz" ? "Quiz" : "Arena"}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 ml-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 w-52"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/5">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Student
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Type
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Quiz / Session
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Original Score
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Archived By
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {archives.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-16 text-center text-slate-400 dark:text-slate-500 text-sm"
                  >
                    <Archive className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    No archived scores found.
                  </td>
                </tr>
              ) : (
                archives.map((a) => {
                  const meta = TYPE_META[a.score_type] ?? TYPE_META.all;
                  const MetaIcon = meta.icon;
                  return (
                    <tr
                      key={a.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Student */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0">
                            <User className="w-3.5 h-3.5 text-violet-500" />
                          </div>
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            {a.user_name ?? "Unknown"}
                          </span>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.bg} ${meta.color}`}
                        >
                          <MetaIcon className="w-3 h-3" />
                          {meta.label}
                        </span>
                      </td>

                      {/* Quiz / Session */}
                      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400 max-w-[200px]">
                        {a.quiz_title ?? (a.session_id ? `Session ${a.session_id.slice(0, 8)}…` : "—")}
                      </td>

                      {/* Original Score */}
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                          {a.original_score}
                        </span>
                      </td>

                      {/* Archived By */}
                      <td className="py-3 px-4 text-sm text-slate-500 dark:text-slate-400">
                        {a.archived_by_name ?? "—"}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Calendar className="w-3 h-3 shrink-0" />
                          <span title={format(new Date(a.archived_at), "PPpp")}>
                            {formatDistanceToNow(new Date(a.archived_at), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-white/5">
            <p className="text-xs text-slate-500">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => pushParams({ page: String(currentPage - 1) })}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => pushParams({ page: String(currentPage + 1) })}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Search, GraduationCap, Building2, X, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

type Tutor = {
  id: string;
  full_name: string;
  role: string;
  organization_id: string | null;
  avatar_url?: string;
  target_language?: string;
  level: number;
  xp: number;
};

type Organization = { id: string; name: string };

export function AdminTutorsClient({
  initialTutors,
  organizations,
}: {
  initialTutors: Tutor[];
  organizations: Organization[];
}) {
  const supabase = createClient();
  const [tutors, setTutors] = useState<Tutor[]>(initialTutors);
  const [search, setSearch] = useState("");
  const [assigningTutor, setAssigningTutor] = useState<Tutor | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [filterOrg, setFilterOrg] = useState<string>("all");

  const filtered = tutors.filter((t) => {
    const matchSearch = t.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchOrg =
      filterOrg === "all"
        ? true
        : filterOrg === "unassigned"
        ? !t.organization_id
        : t.organization_id === filterOrg;
    return matchSearch && matchOrg;
  });

  const getOrgName = (orgId: string | null) => {
    if (!orgId) return null;
    return organizations.find((o) => o.id === orgId)?.name ?? "Unknown";
  };

  const handleAssign = async () => {
    if (!assigningTutor) return;
    setSaving(true);
    const orgValue = selectedOrg === "none" ? null : selectedOrg || null;
    const { error } = await supabase
      .from("profiles")
      .update({ organization_id: orgValue })
      .eq("id", assigningTutor.id);

    if (error) {
      toast.error("Failed to assign organization");
      setSaving(false);
      return;
    }

    setTutors((prev) =>
      prev.map((t) =>
        t.id === assigningTutor.id ? { ...t, organization_id: orgValue } : t
      )
    );
    toast.success(
      orgValue
        ? `${assigningTutor.full_name} assigned to ${getOrgName(orgValue)}`
        : `${assigningTutor.full_name} unassigned from organization`
    );
    setAssigningTutor(null);
    setSelectedOrg("");
    setSaving(false);
  };

  const assigned = tutors.filter((t) => t.organization_id).length;
  const unassigned = tutors.filter((t) => !t.organization_id).length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Tutors", value: tutors.length, color: "text-emerald-500", bg: "bg-emerald-500/10", icon: GraduationCap },
          { label: "Assigned", value: assigned, color: "text-blue-500", bg: "bg-blue-500/10", icon: CheckCircle2 },
          { label: "Unassigned", value: unassigned, color: "text-amber-500", bg: "bg-amber-500/10", icon: AlertCircle },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-white/5 flex items-center gap-4">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-xl font-black text-slate-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 flex-1">
            <Search size={14} className="text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search tutors by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm text-slate-700 dark:text-slate-300 flex-1 outline-none placeholder:text-slate-400"
            />
          </div>
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2">
            <Building2 size={14} className="text-slate-400 flex-shrink-0" />
            <select
              value={filterOrg}
              onChange={(e) => setFilterOrg(e.target.value)}
              className="bg-transparent text-sm text-slate-700 dark:text-slate-300 outline-none"
            >
              <option value="all">All Organizations</option>
              <option value="unassigned">Unassigned</option>
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tutors Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/5">
                <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3">Tutor</th>
                <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3">Organization</th>
                <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">Language</th>
                <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3 hidden lg:table-cell">Level / XP</th>
                <th className="text-right text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {t.avatar_url ? (
                        <img src={t.avatar_url} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {t.full_name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="font-semibold text-slate-800 dark:text-white text-sm">{t.full_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {t.organization_id ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 px-2.5 py-1 rounded-full">
                        <Building2 size={11} />
                        {getOrgName(t.organization_id)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 px-2.5 py-1 rounded-full">
                        <AlertCircle size={11} />
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell text-slate-500 capitalize">{t.target_language || "—"}</td>
                  <td className="px-5 py-3 hidden lg:table-cell">
                    <span className="text-slate-700 dark:text-slate-300">Lvl {t.level} · {t.xp} XP</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => {
                        setAssigningTutor(t);
                        setSelectedOrg(t.organization_id ?? "none");
                      }}
                      className="text-xs bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold px-3 py-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                    >
                      Assign Org
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-400 text-sm">No tutors found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Organization Modal */}
      {assigningTutor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-200 dark:border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">Assign Organization</h3>
              <button onClick={() => setAssigningTutor(null)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X size={16} className="text-slate-400" />
              </button>
            </div>
            <div className="flex items-center gap-3 mb-5 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              {assigningTutor.avatar_url ? (
                <img src={assigningTutor.avatar_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center text-white font-black">
                  {assigningTutor.full_name?.[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-semibold text-slate-800 dark:text-white">{assigningTutor.full_name}</p>
                <p className="text-xs text-slate-400">Tutor</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-2 font-medium">Select Organization</p>
            <select
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 outline-none mb-5"
            >
              <option value="none">— Remove from organization —</option>
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
            {organizations.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mb-4 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 rounded-lg">
                No organizations found. Create one in database first.
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setAssigningTutor(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

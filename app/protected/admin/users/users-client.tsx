"use client";

import { useState } from "react";
import { Search, Filter, Mail, Edit2, Trash2, Users, Shield, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

type UserProfile = {
  id: string;
  full_name: string;
  role: string;
  target_language?: string;
  level: number;
  xp: number;
  country_residence?: string;
  updated_at: string;
};

export function AdminUsersClient({ initialUsers }: { initialUsers: UserProfile[] }) {
  const supabase = createClient();
  const [users, setUsers] = useState<UserProfile[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editRole, setEditRole] = useState("");

  const filtered = users.filter((u) => {
    const matchSearch = u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.country_residence?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleRoleChange = async () => {
    if (!editingUser) return;
    const { error } = await supabase.from("profiles").update({ role: editRole }).eq("id", editingUser.id);
    if (error) { toast.error("Failed to update role"); return; }
    setUsers((prev) => prev.map((u) => u.id === editingUser.id ? { ...u, role: editRole } : u));
    toast.success(`Role updated to ${editRole}`);
    setEditingUser(null);
  };

  const roleIcon = (role: string) => {
    if (role === "admin") return <Shield size={12} className="text-indigo-500" />;
    if (role === "tutor") return <GraduationCap size={12} className="text-emerald-500" />;
    return <Users size={12} className="text-slate-400" />;
  };

  const roleBadgeClass = (role: string) =>
    role === "admin" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300" :
    role === "tutor" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" :
    "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400";

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
        {[
          { label: "Total Users", value: users.length, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Tutors", value: users.filter(u => u.role === "tutor").length, icon: GraduationCap, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Admins", value: users.filter(u => u.role === "admin").length, icon: Shield, color: "text-indigo-500", bg: "bg-indigo-500/10" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-white/5 flex items-center gap-4">
            <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xl font-black text-slate-900 dark:text-white">{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 flex-1">
            <Search size={14} className="text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by name or country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm text-slate-700 dark:text-slate-300 flex-1 outline-none placeholder:text-slate-400"
            />
          </div>
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
            <Filter size={14} className="text-slate-400 flex-shrink-0" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-transparent text-sm text-slate-700 dark:text-slate-300 outline-none"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="tutor">Tutors</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/5">
                <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3">User</th>
                <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3">Role</th>
                <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">Language</th>
                <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3 hidden lg:table-cell">Level / XP</th>
                <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3 hidden xl:table-cell">Country</th>
                <th className="text-right text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {u.full_name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-800 dark:text-white text-sm">{u.full_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${roleBadgeClass(u.role)}`}>
                      {roleIcon(u.role)} {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    <span className="text-slate-500 capitalize">{u.target_language || "—"}</span>
                  </td>
                  <td className="px-5 py-3 hidden lg:table-cell">
                    <span className="text-slate-700 dark:text-slate-300">Lvl {u.level} · {u.xp} XP</span>
                  </td>
                  <td className="px-5 py-3 hidden xl:table-cell">
                    <span className="text-slate-500">{u.country_residence || "—"}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setEditingUser(u); setEditRole(u.role); }}
                        className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
                        title="Edit role"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        title="Message user"
                      >
                        <Mail size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400 text-sm">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Role Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-200 dark:border-white/10">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1">Change Role</h3>
            <p className="text-sm text-slate-500 mb-5">Update role for <span className="font-semibold text-slate-700 dark:text-slate-300">{editingUser.full_name}</span></p>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 outline-none mb-5"
            >
              <option value="student">Student</option>
              <option value="tutor">Tutor</option>
              <option value="admin">Admin</option>
            </select>
            <div className="flex gap-3">
              <button onClick={() => setEditingUser(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
              <button onClick={handleRoleChange} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

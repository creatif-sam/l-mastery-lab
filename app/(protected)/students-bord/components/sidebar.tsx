// app/(protected)/students-bord/_components/sidebar.tsx
import { LayoutDashboard, Inbox, BookOpen, Users, Settings, LogOut } from "lucide-react";
import Link from "next/link";

export function Sidebar() {
  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", active: true },
    { icon: Inbox, label: "Inbox", active: false },
    { icon: BookOpen, label: "Lessons", active: false },
    { icon: Users, label: "Lab Groups", active: false },
  ];

  return (
    <nav className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/5 p-6 flex flex-col">
      <div className="flex items-center gap-2 mb-10 px-2">
        <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center text-white font-black">L</div>
        <span className="font-black text-xl">LML.</span>
      </div>

      <div className="space-y-2 flex-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-4">Overview</p>
        {menuItems.map((item) => (
          <button
            key={item.label}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
              item.active 
                ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20" 
                : "text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-sm font-bold">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="pt-6 border-t border-slate-100 dark:border-white/5 space-y-2">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:text-red-500 transition-colors">
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-bold">Logout</span>
        </button>
      </div>
    </nav>
  );
}
"use client";

import { 
  LayoutDashboard, 
  Inbox, 
  BookOpen, 
  Users, 
  LogOut, 
  Trophy, 
  HelpCircle 
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/student-board", active: pathname === "/student-board" },
    { icon: BookOpen, label: "Lessons", href: "/student-board/lessons", active: pathname === "/student-board/lessons" },
    { icon: HelpCircle, label: "Quiz", href: "/student-board/quiz", active: pathname === "/student-board/quiz" },
    { icon: Trophy, label: "Arena", href: "/student-board/arena", active: pathname === "/student-board/arena" },
    { icon: Users, label: "Groups", href: "/student-board/groups", active: pathname === "/student-board/groups" },
    { icon: Inbox, label: "Inbox", href: "/student-board/inbox", active: pathname === "/student-board/inbox" },
  ];

  return (
    <>
      {/* --- DESKTOP SIDEBAR --- */}
      <nav className="hidden md:flex w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/5 p-6 flex-col h-screen sticky top-0">
        {/* Simplified LML Logo Section */}
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center text-white font-black shadow-lg shadow-violet-500/20">
            L
          </div>
          <span className="font-black text-xl tracking-tighter leading-none">LML.</span>
        </div>

        <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-4">Overview</p>
          {menuItems.map((item) => (
            <Link
              href={item.href}
              key={item.label}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                item.active
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                  : "text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-bold">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="pt-6 border-t border-slate-100 dark:border-white/5 space-y-2">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:text-red-500 transition-colors group font-bold text-sm">
            <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            Logout
          </button>
        </div>
      </nav>

      {/* --- MOBILE BOTTOM NAVIGATION --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-slate-200 dark:border-white/5 px-2 pb-safe">
        <div className="flex justify-around items-center h-16">
          {menuItems.slice(0, 5).map((item) => (
            <Link
              href={item.href}
              key={item.label}
              className={`flex flex-col items-center justify-center gap-1 min-w-[60px] transition-all relative ${
                item.active ? "text-violet-600" : "text-slate-400"
              }`}
            >
              <div className={`p-1 rounded-lg transition-colors ${item.active ? "bg-violet-500/10" : ""}`}>
                <item.icon className={`w-5 h-5 ${item.active ? "stroke-[2.5px]" : "stroke-[2px]"}`} />
              </div>
              <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
              {item.active && <div className="w-1 h-1 bg-violet-600 rounded-full absolute -bottom-1" />}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
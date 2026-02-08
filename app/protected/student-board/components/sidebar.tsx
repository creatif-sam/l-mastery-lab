"use client";

import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Inbox, 
  BookOpen, 
  Users, 
  LogOut, 
  Trophy, 
  HelpCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation"; // Added useRouter
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client"; // Ensure you use the client-side creator

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient(); // Initialize Supabase client
  
  const [isCollapsed, setIsCollapsed] = useState<boolean | null>(null);

  useEffect(() => {
    const savedState = localStorage.getItem("sidebar-collapsed");
    setIsCollapsed(savedState === "true");
  }, []);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", String(newState));
  };

  // --- NEW LOGOUT HANDLER ---
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout error:", error.message);
      return;
    }
    // Refresh the page or redirect to home to clear the auth state
    router.push("/");
    router.refresh();
  };

  if (isCollapsed === null) return <div className="hidden md:flex w-64 bg-white dark:bg-slate-900 border-r h-screen" />;

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/protected/student-board", active: pathname === "/protected/student-board" },
    { icon: BookOpen, label: "Lessons", href: "/student-board/lessons", active: pathname === "/student-board/lessons" },
    { icon: HelpCircle, label: "Quiz", href: "/protected/student-board/quiz", active: pathname === "/protected/student-board/quiz" },
    { icon: Trophy, label: "Arena", href: "/protected/student-board/ranking", active: pathname === "/protected/student-board/ranking" },
    { icon: Users, label: "Groups", href: "/protected/student-board/network", active: pathname === "/protected/student-board/network" },
    { icon: Inbox, label: "Inbox", href: "/student-board/inbox", active: pathname === "/student-board/inbox" },
  ];

  return (
    <>
      <nav className={cn(
        "hidden md:flex bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/5 p-4 flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out relative z-[60]",
        isCollapsed ? "w-20" : "w-64"
      )}>
        
        <button 
          onClick={toggleSidebar}
          className="absolute -right-3 top-10 w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-violet-700 transition-colors z-[70]"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className={cn("flex items-center gap-3 mb-10", isCollapsed ? "justify-center" : "px-2")}>
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex-shrink-0 flex items-center justify-center text-white font-black shadow-lg shadow-violet-500/20">L</div>
          {!isCollapsed && <span className="font-black text-xl tracking-tighter leading-none animate-in fade-in duration-500">LML.</span>}
        </div>

        <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
          {!isCollapsed && (
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-4">Overview</p>
          )}
          
          {menuItems.map((item) => (
            <Link
              href={item.href}
              key={item.label}
              className={cn(
                "w-full flex items-center rounded-xl transition-all group",
                isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5",
                item.active
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                  : "text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5"
              )}
              title={isCollapsed ? item.label : ""}
            >
              <item.icon className={cn("flex-shrink-0", isCollapsed ? "w-6 h-6" : "w-5 h-5")} />
              {!isCollapsed && <span className="text-sm font-bold truncate animate-in fade-in">{item.label}</span>}
            </Link>
          ))}
        </div>

        <div className="pt-6 border-t border-slate-100 dark:border-white/5 space-y-2">
          {/* Linked the handleLogout function here */}
          <button 
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center transition-colors group font-bold text-sm",
              isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5 text-slate-500 hover:text-red-500"
            )}
          >
            <LogOut className={cn("flex-shrink-0", isCollapsed ? "w-6 h-6 text-slate-400" : "w-5 h-5 group-hover:text-red-500")} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </nav>

      {/* --- MOBILE NAVIGATION --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-slate-200 dark:border-white/5 px-2">
        <div className="flex justify-around items-center h-16">
          {menuItems.slice(0, 5).map((item) => (
            <Link
              href={item.href}
              key={item.label}
              className={cn("flex flex-col items-center justify-center gap-1 min-w-[60px] relative", item.active ? "text-violet-600" : "text-slate-400")}
            >
              <div className={cn("p-1 rounded-lg", item.active ? "bg-violet-500/10" : "")}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
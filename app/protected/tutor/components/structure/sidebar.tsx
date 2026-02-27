"use client";

import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  MessageSquare,
  Mail,
  HelpCircle,
  Settings,
  MoreHorizontal,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export function TutorSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isCollapsed, setIsCollapsed] = useState<boolean | null>(null);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    const savedState = localStorage.getItem("tutor-sidebar-collapsed");
    setIsCollapsed(savedState === "true");
  }, []);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("tutor-sidebar-collapsed", String(newState));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (isCollapsed === null) return <div className="hidden md:flex w-64 bg-slate-950 h-screen flex-shrink-0" />;

  const menuItems = [
    { icon: LayoutDashboard, label: "Overview",       href: "/protected/tutor",                exact: true },
    { icon: Users,           label: "My Students",    href: "/protected/tutor/students" },
    { icon: BookOpen,        label: "Lessons",        href: "/protected/tutor/lessons" },
    { icon: HelpCircle,      label: "Quizzes",        href: "/protected/tutor/quiz" },
    { icon: MessageSquare,   label: "Community",      href: "/protected/tutor/community" },
    { icon: FileText,        label: "Blog",           href: "/protected/tutor/blog" },
    { icon: Mail,            label: "Messages",       href: "/protected/tutor/messages" },
    { icon: Bell,            label: "Notifications",  href: "/protected/tutor/notifications" },
    { icon: Settings,        label: "Settings",       href: "/protected/tutor/settings" },
  ];

  // Top 5 for mobile bottom bar; remainder go in "More" popup
  const bottomPrimary = menuItems.slice(0, 4);
  const bottomMore    = menuItems.slice(4);

  const isActive = (item: { href: string; exact?: boolean }) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <>
      {/* ── DESKTOP SIDEBAR ── */}
      <nav className={cn(
        "hidden md:flex bg-slate-950 border-r border-white/5 p-4 flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out relative z-[60] flex-shrink-0",
        isCollapsed ? "w-20" : "w-64"
      )}>
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-10 w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-emerald-700 transition-colors z-[70]"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className={cn("flex items-center gap-3 mb-10", isCollapsed ? "justify-center" : "px-2")}>
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex-shrink-0 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <GraduationCap size={18} className="text-white" />
          </div>
          {!isCollapsed && (
            <div className="animate-in fade-in duration-300">
              <span className="font-black text-lg text-white tracking-tight leading-none block">LML Tutor</span>
              <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-widest">Teacher Hub</span>
            </div>
          )}
        </div>

        <div className="space-y-1 flex-1 overflow-y-auto">
          {!isCollapsed && <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-3">Workspace</p>}
          {menuItems.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                  isCollapsed ? "justify-center" : "",
                  active
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon size={18} className="flex-shrink-0" />
                {!isCollapsed && <span className="text-sm font-medium animate-in fade-in duration-300">{item.label}</span>}
              </Link>
            );
          })}
        </div>

        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 mt-4",
            isCollapsed ? "justify-center" : ""
          )}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </nav>

      {/* ── MOBILE BOTTOM NAV ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950 border-t border-white/5 safe-area-bottom">
        <div className="flex items-stretch h-16">
          {bottomPrimary.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors",
                  active ? "text-emerald-400" : "text-slate-500 hover:text-slate-300"
                )}
              >
                <item.icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                <span className="text-[9px] font-bold tracking-wide leading-none">
                  {item.label.split(" ")[0]}
                </span>
              </Link>
            );
          })}

          {/* More Button */}
          <button
            onClick={() => setShowMore(true)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors",
              showMore ? "text-emerald-400" : "text-slate-500 hover:text-slate-300"
            )}
          >
            <MoreHorizontal size={20} strokeWidth={1.8} />
            <span className="text-[9px] font-bold tracking-wide leading-none">More</span>
          </button>
        </div>
      </div>

      {/* ── MOBILE "MORE" POPUP DRAWER ── */}
      {showMore && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[55]"
            onClick={() => setShowMore(false)}
          />
          {/* Sheet */}
          <div className="md:hidden fixed bottom-16 left-0 right-0 z-[56] bg-slate-900 border-t border-white/10 rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
            <div className="px-5 pt-4 pb-2 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">More</span>
              <button
                onClick={() => setShowMore(false)}
                className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1 px-3 pb-5">
              {bottomMore.map((item) => {
                const active = isActive(item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMore(false)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl transition-all active:scale-95",
                      active
                        ? "bg-emerald-600/20 text-emerald-400"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <item.icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                    <span className="text-[10px] font-bold text-center leading-tight">{item.label}</span>
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl text-red-400 hover:bg-red-500/10 transition-all active:scale-95"
              >
                <LogOut size={22} strokeWidth={1.8} />
                <span className="text-[10px] font-bold leading-tight">Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

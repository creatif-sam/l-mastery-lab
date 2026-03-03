"use client";

import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Mail,
  FileText,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  GraduationCap,
  MessageSquare,
  MessageCircle,
  Eye,
  MoreHorizontal,
  X,
  Activity,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isCollapsed, setIsCollapsed] = useState<boolean | null>(null);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    const savedState = localStorage.getItem("admin-sidebar-collapsed");
    setIsCollapsed(savedState === "true");
  }, []);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("admin-sidebar-collapsed", String(newState));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (isCollapsed === null) return <div className="hidden md:flex w-64 bg-slate-950 h-screen flex-shrink-0" />;

  const menuItems = [
    { icon: LayoutDashboard, label: "Overview",       href: "/protected/admin",              exact: true },
    { icon: Users,           label: "Users",          href: "/protected/admin/users" },
    { icon: GraduationCap,   label: "Tutors",         href: "/protected/admin/tutors" },
    { icon: Building2,       label: "Organisations",  href: "/protected/admin/organizations" },
    { icon: BarChart3,       label: "Analytics",      href: "/protected/admin/analytics" },
    { icon: MessageSquare,   label: "Community",      href: "/protected/admin/community" },
    { icon: MessageCircle,   label: "Messages",       href: "/protected/admin/messages" },
    { icon: Mail,            label: "Mail Campaigns", href: "/protected/admin/mail" },
    { icon: FileText,        label: "Blog",           href: "/protected/admin/blog" },
    { icon: Bell,            label: "Notifications",  href: "/protected/admin/notifications" },
    { icon: Activity,        label: "Platform Logs",  href: "/protected/admin/logs" },
    { icon: Settings,        label: "Settings",       href: "/protected/admin/settings" },
  ];

  // Top 4 for mobile bottom bar; remainder in "More" popup
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
          className="absolute -right-3 top-10 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-indigo-700 transition-colors z-[70]"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Logo */}
        <div className={cn("flex items-center gap-3 mb-10", isCollapsed ? "justify-center" : "px-2")}>
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex-shrink-0 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Shield size={18} className="text-white" />
          </div>
          {!isCollapsed && (
            <div className="animate-in fade-in duration-300">
              <span className="font-black text-lg text-white tracking-tight leading-none block">LML Admin</span>
              <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-widest">Control Panel</span>
            </div>
          )}
        </div>

        {/* Menu */}
        <div className="space-y-1 flex-1 overflow-y-auto scrollbar-thin">
          {!isCollapsed && (
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-3">Management</p>
          )}
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
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon size={18} className={cn("flex-shrink-0", active ? "text-white" : "text-slate-400 group-hover:text-white")} />
                {!isCollapsed && (
                  <span className={cn("text-sm font-medium animate-in fade-in duration-300", active ? "text-white" : "")}>
                    {item.label}
                  </span>
                )}
                {isCollapsed && (
                  <div className="absolute left-20 bg-slate-800 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* View Student Dashboard */}
        <div className={cn("border-t border-white/5 pt-3 mt-3 space-y-1")}>
          {!isCollapsed && (
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">Preview</p>
          )}
          <Link
            href="/protected/student-board"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300",
              isCollapsed ? "justify-center" : ""
            )}
          >
            <Eye size={18} className="flex-shrink-0" />
            {!isCollapsed && <span className="text-sm font-medium">Student View</span>}
            {isCollapsed && (
              <div className="absolute left-20 bg-slate-800 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
                Student View
              </div>
            )}
          </Link>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 mt-2",
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
                  active ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
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
              showMore ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
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
          <div
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[55]"
            onClick={() => setShowMore(false)}
          />
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
            <div className="grid grid-cols-4 gap-1 px-3 pb-3">
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
                        ? "bg-indigo-600/20 text-indigo-400"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <item.icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                    <span className="text-[10px] font-bold text-center leading-tight">{item.label}</span>
                  </Link>
                );
              })}
              <Link
                href="/protected/student-board"
                onClick={() => setShowMore(false)}
                className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl text-emerald-400 hover:bg-emerald-500/10 transition-all active:scale-95"
              >
                <Eye size={22} strokeWidth={1.8} />
                <span className="text-[10px] font-bold text-center leading-tight">Student View</span>
              </Link>
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

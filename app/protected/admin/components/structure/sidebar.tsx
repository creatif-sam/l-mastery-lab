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
    { icon: LayoutDashboard, label: "Overview", href: "/protected/admin", exact: true },
    { icon: Users, label: "Users", href: "/protected/admin/users" },
    { icon: BarChart3, label: "Analytics", href: "/protected/admin/analytics" },
    { icon: Mail, label: "Mail Campaigns", href: "/protected/admin/mail" },
    { icon: FileText, label: "Blog", href: "/protected/admin/blog" },
    { icon: Bell, label: "Notifications", href: "/protected/admin/notifications" },
    { icon: Settings, label: "Settings", href: "/protected/admin/settings" },
  ];

  const isActive = (item: { href: string; exact?: boolean }) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <>
      {/* Desktop Sidebar */}
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

        {/* Logout */}
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
    </>
  );
}

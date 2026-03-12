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
  ChevronRight,
  Bell,
  FileText,
  MessageSquare,
  Mail,
  MoreHorizontal
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  
  const [isCollapsed, setIsCollapsed] = useState<boolean | null>(null);
  const [hasUnread, setHasUnread] = useState(false); // 🔔 Notification State
  const [sideOpen, setSideOpen] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [newPostsCount, setNewPostsCount] = useState(0); // 🔔 Community Posts Counter

  // Immediately clear community badge when user navigates to that page
  useEffect(() => {
    if (pathname.startsWith("/protected/student-board/community")) {
      setNewPostsCount(0);
    }
  }, [pathname]);

  useEffect(() => {
    const savedState = localStorage.getItem("sidebar-collapsed");
    setIsCollapsed(savedState === "true");

    // Check for unread messages and new community posts
    const checkNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Check unread messages
      const { count: unreadCount } = await supabase
        .from("messages")
        .select("*", { count: 'exact', head: true })
        .eq("receiver_id", user.id)
        .eq("is_read", false);
      
      setHasUnread(!!unreadCount && unreadCount > 0);

      // Check new community posts since last visit
      const lastVisit = localStorage.getItem("community_last_visit");
      
      // If never visited, show posts from last 24 hours
      // If visited before, show posts created after that visit
      const checkFromTime = lastVisit 
        ? new Date(lastVisit) 
        : new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      
      const { count: postsCount } = await supabase
        .from("community_posts")
        .select("*", { count: 'exact', head: true })
        .gt("created_at", checkFromTime.toISOString());
      
      setNewPostsCount(postsCount || 0);
    };
    
    checkNotifications();
    
    // Re-check when component mounts or pathname changes to update badge
    const interval = setInterval(checkNotifications, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [supabase, pathname]);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", String(newState));
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout error:", error.message);
      return;
    }
    router.push("/");
    router.refresh();
  };

  if (isCollapsed === null) return <div className="hidden md:flex w-64 bg-white dark:bg-slate-900 border-r h-screen" />;

  const menuItems = [
    { icon: LayoutDashboard, label: "Board", href: "/protected/student-board", active: pathname === "/protected/student-board" },
    { icon: BookOpen, label: "Lessons", href: "/protected/student-board/lessons", active: pathname === "/protected/student-board/lessons" },
    { icon: HelpCircle, label: "Quiz", href: "/protected/student-board/quiz", active: pathname === "/protected/student-board/quiz" },
    { icon: MessageSquare, label: "Community", href: "/protected/student-board/community", active: pathname.startsWith("/protected/student-board/community"), badge: newPostsCount > 0, badgeCount: newPostsCount },
    { icon: Trophy, label: "Arena", href: "/protected/student-board/ranking", active: pathname === "/protected/student-board/ranking" },
    { icon: Users, label: "Network", href: "/protected/student-board/network", active: pathname === "/protected/student-board/network" },
    { icon: FileText, label: "Blog", href: "/protected/student-board/blog", active: pathname.startsWith("/protected/student-board/blog") },
    { icon: Mail, label: "Messages", href: "/protected/student-board/messages", active: pathname.startsWith("/protected/student-board/messages") },
    { icon: Inbox, label: "Inbox", href: "/protected/student-board/inbox", active: pathname === "/protected/student-board/inbox", badge: hasUnread },
    { icon: Bell, label: "Alerts", href: "/protected/student-board/notifications", active: pathname === "/protected/student-board/notifications" },
  ];

  // Mobile: 4 bottom tabs + More button (Board, Lessons, Quiz, Community)
  const bottomNavItems = [menuItems[0], menuItems[1], menuItems[2], menuItems[3]];
  // Mobile: Items shown in More menu (Arena, Network, Blog, Messages, Inbox, Alerts)
  const moreMenuItems = [menuItems[4], menuItems[5], menuItems[6], menuItems[7], menuItems[8], menuItems[9]];

  return (
    <>
      {/* --- DESKTOP SIDEBAR --- */}
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
          {!isCollapsed && <span className="font-black text-xl tracking-tighter leading-none animate-in fade-in duration-500 text-slate-900 dark:text-white">LML.</span>}
        </div>

        <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
          {!isCollapsed && (
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-4">Mastery Hub</p>
          )}
          
          {menuItems.map((item) => (
            <Link
              href={item.href}
              key={item.label}
              className={cn(
                "w-full flex items-center rounded-xl transition-all group relative",
                isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5",
                item.active
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                  : "text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5"
              )}
              title={isCollapsed ? item.label : ""}
            >
              <div className="relative">
                <item.icon className={cn("flex-shrink-0", isCollapsed ? "w-6 h-6" : "w-5 h-5")} />
                {item.badge && !item.badgeCount && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
                )}
                {item.badgeCount && item.badgeCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[9px] font-bold text-white px-1">
                    {item.badgeCount > 99 ? '99+' : item.badgeCount}
                  </span>
                )}
              </div>
              {!isCollapsed && (
                <div className="flex items-center justify-between flex-1">
                  <span className="text-sm font-bold truncate animate-in fade-in">{item.label}</span>
                  {item.badgeCount && item.badgeCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                      {item.badgeCount > 99 ? '99+' : item.badgeCount}
                    </span>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>

        <div className="pt-6 border-t border-slate-100 dark:border-white/5 space-y-2">
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

      {/* --- MOBILE BOTTOM NAV (4 tabs + More) --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 px-1 pb-safe">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
          {bottomNavItems.map((item) => (
            <Link
              href={item.href}
              key={item.label}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 transition-all h-full relative",
                item.active ? "text-violet-600" : "text-slate-400"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-xl transition-colors relative",
                item.active ? "bg-violet-500/10" : "bg-transparent"
              )}>
                <item.icon className="w-5 h-5" />
                {item.badgeCount && item.badgeCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-red-500 rounded-full border border-white dark:border-slate-950 flex items-center justify-center text-[8px] font-bold text-white px-1">
                    {item.badgeCount > 99 ? '99+' : item.badgeCount}
                  </span>
                )}
                {item.badge && !item.badgeCount && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-950" />
                )}
              </div>
              <span className="text-[9px] font-black uppercase tracking-tight text-center leading-none">
                {item.label}
              </span>
            </Link>
          ))}
          
          {/* More Button */}
          <button
            onClick={() => setShowMoreMenu(true)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 transition-all h-full relative",
              showMoreMenu ? "text-violet-600" : "text-slate-400"
            )}
          >
            <div className={cn(
              "p-1.5 rounded-xl transition-colors relative",
              showMoreMenu ? "bg-violet-500/10" : "bg-transparent"
            )}>
              <MoreHorizontal className="w-5 h-5" />
              {hasUnread && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-950" />
              )}
            </div>
            <span className="text-[9px] font-black uppercase tracking-tight text-center leading-none">
              More
            </span>
          </button>
        </div>
      </nav>

      {/* --- MOBILE MORE MENU MODAL --- */}
      {showMoreMenu && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowMoreMenu(false)}
          />
          
          {/* More Menu Panel */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-[120] bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[70vh] overflow-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 px-6 py-4 rounded-t-3xl z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">More Options</h3>
                <button
                  onClick={() => setShowMoreMenu(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <ChevronRight size={16} className="rotate-90" />
                </button>
              </div>
            </div>
            
            <div className="p-4 space-y-2 pb-24">
              {moreMenuItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setShowMoreMenu(false)}
                  className={cn(
                    "relative flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all",
                    item.active
                      ? "bg-violet-500 text-white shadow-lg shadow-violet-500/25"
                      : "text-slate-600 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-white/5 hover:text-violet-600 dark:hover:text-white active:scale-95"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 relative",
                    item.active
                      ? "bg-white/20"
                      : "bg-slate-100 dark:bg-slate-800"
                  )}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-bold block">{item.label}</span>
                  </div>
                  {item.badgeCount && item.badgeCount > 0 ? (
                    <span className="min-w-[24px] h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold px-2">
                      {item.badgeCount > 99 ? '99+' : item.badgeCount}
                    </span>
                  ) : item.badge ? (
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full flex-shrink-0" />
                  ) : null}
                </Link>
              ))}
              
              {/* Logout Button */}
              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  handleLogout();
                }}
                className="w-full relative flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-red-100 dark:bg-red-950/30">
                  <LogOut className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <span className="text-sm font-bold block">Logout</span>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
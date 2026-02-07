// app/(protected)/student-board/_components/header.tsx
import { Search, Bell } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { createClient } from "@/lib/supabase/server";

export async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(`
      full_name, 
      avatar_url, 
      role,
      organizations (
        name,
        logo_url
      )
    `)
    .eq("id", user?.id)
    .single();

  if (error) console.error("Header Fetch Error:", error);

  const org = Array.isArray(profile?.organizations) 
    ? profile?.organizations[0] 
    : profile?.organizations;

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
    : "??";

  return (
    <header className="px-4 md:px-8 py-3 md:py-4 flex justify-between items-center bg-white/50 dark:bg-black/50 backdrop-blur-md border-b border-slate-200 dark:border-white/5 relative z-50">
      
      {/* Search Bar */}
      <div className="relative hidden md:block w-72 lg:w-96 group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
        <input 
          type="text" 
          placeholder="Search course..." 
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-2 md:gap-6">
        <div className="flex items-center gap-1 md:gap-3">
          <ThemeSwitcher />
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg relative">
            <Bell className="w-5 h-5 text-slate-500" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-black" />
          </button>
        </div>

        <div className="hidden sm:block h-6 w-[1px] bg-slate-200 dark:bg-white/10" />

        {/* --- UPDATED DYNAMIC PROFILE SECTION --- */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:flex flex-col">
            <p className="text-sm font-black tracking-tight leading-none text-slate-900 dark:text-white">
              {profile?.full_name || "Guest User"}
            </p>
            
            {/* Role | Organization Badge */}
            <div className="flex items-center justify-end gap-1.5 mt-1.5">
              <span className="text-[10px] text-violet-600 dark:text-violet-400 font-black uppercase tracking-wider">
                {profile?.role || "Student"}
              </span>
              <span className="text-[10px] text-slate-300 dark:text-slate-700 font-light">|</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                {org?.name || "Independent"}
              </span>
            </div>
          </div>
          
          <div className="relative">
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt="Avatar" 
                className="w-9 h-9 rounded-xl object-cover shadow-lg ring-2 ring-violet-500/10"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center text-white text-xs font-black shadow-lg">
                {initials}
              </div>
            )}
            
            {org?.logo_url && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-black overflow-hidden bg-white shadow-sm">
                <img src={org.logo_url} alt="Org" className="w-full h-full object-contain" />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
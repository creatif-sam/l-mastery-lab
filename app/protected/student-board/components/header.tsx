// app/(protected)/student-board/_components/header.tsx
import { Search } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import { NotificationCenter } from "./notifications"; // Import your new client component

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

  // Handle Supabase join result (might be an array or object)
  const org = Array.isArray(profile?.organizations) 
    ? profile?.organizations[0] 
    : profile?.organizations;

  // Construct the Org Logo URL
  const orgLogoUrl = org?.logo_url 
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/organization-logos/${org.logo_url}`
    : null;

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
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
        />
      </div>

      <div className="flex items-center gap-2 md:gap-6">
        <div className="flex items-center gap-1 md:gap-3">
          <ThemeSwitcher />
          
          {/* --- NEW NOTIFICATION CENTER --- */}
          <NotificationCenter />
        </div>

        <div className="hidden sm:block h-6 w-[1px] bg-slate-200 dark:bg-white/10" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:flex flex-col">
            <p className="text-sm font-black tracking-tight leading-none text-slate-900 dark:text-white">
              {profile?.full_name || "Guest User"}
            </p>
            
            <div className="flex items-center justify-end gap-1.5 mt-1.5">
              <span className="text-[10px] text-violet-600 dark:text-violet-400 font-black uppercase tracking-wider">
                {profile?.role || "Student"}
              </span>
              <span className="text-[10px] text-slate-300 dark:text-slate-700 font-light">|</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider truncate max-w-[100px]">
                {org?.name || "Independent"}
              </span>
            </div>
          </div>
          
          <div className="relative group cursor-pointer">
            {/* User Avatar */}
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg ring-2 ring-violet-500/10 transition-transform group-hover:scale-105">
              {profile?.avatar_url ? (
                <Image 
                  src={profile.avatar_url} 
                  alt="Avatar" 
                  width={40} 
                  height={40} 
                  className="object-cover w-full h-full"
                  unoptimized 
                />
              ) : (
                <div className="w-full h-full bg-violet-600 flex items-center justify-center text-white text-xs font-black">
                  {initials}
                </div>
              )}
            </div>
            
            {/* Organization Logo Badge */}
            {orgLogoUrl && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg border-2 border-white dark:border-slate-900 overflow-hidden bg-white shadow-md flex items-center justify-center">
                <Image 
                  src={orgLogoUrl} 
                  alt="Org Logo" 
                  width={20} 
                  height={20} 
                  className="object-contain p-0.5"
                  unoptimized 
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
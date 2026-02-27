"use client";

import { Search, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";

export function TutorHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { theme, setTheme } = useTheme();
  const [tutorName, setTutorName] = useState("Tutor");
  const [orgLogoUrl, setOrgLogoUrl] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, organization_id")
        .eq("id", user.id)
        .single();
      if (profile?.full_name) setTutorName(profile.full_name.split(" ")[0]);

      // Fetch org separately to avoid FK-join failures
      if (profile?.organization_id) {
        const { data: org } = await supabase
          .from("organizations")
          .select("name, logo_url")
          .eq("id", profile.organization_id)
          .single();
        if (org?.name) setOrgName(org.name);
        if (org?.logo_url) {
          setOrgLogoUrl(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/organization-logos/${org.logo_url}`
          );
        }
      }
    };
    load();
  }, []);

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/5 flex items-center justify-between px-6 z-50 flex-shrink-0">
      <div className="flex items-center gap-3">
        {/* Organisation logo */}
        {orgLogoUrl ? (
          <Image
            src={orgLogoUrl}
            alt={orgName ?? "Organisation"}
            width={32}
            height={32}
            className="w-8 h-8 rounded-lg object-contain border border-slate-200 dark:border-white/10 bg-white"
            unoptimized
          />
        ) : orgName ? (
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-300 text-xs font-black border border-emerald-200 dark:border-emerald-500/30">
            {orgName.charAt(0).toUpperCase()}
          </div>
        ) : null}
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-none">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 w-52">
          <Search size={14} className="text-slate-400" />
          <input type="text" placeholder="Search students..." className="bg-transparent text-sm text-slate-600 dark:text-slate-300 flex-1 outline-none placeholder:text-slate-400" />
        </div>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notification bell with dropdown */}
        <NotificationDropdown allLink="/protected/tutor/notifications" />

        <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-md">
          {tutorName.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}

import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "./components/sidebar";
import { Header } from "./components/header";
import { 
  BookOpen, 
  Target, 
  Zap, 
  TrendingUp, 
  ArrowRight, 
  Award, 
  Users, 
  Clock 
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { MeetingCard } from "./components/home/meeting-card";
import { PhraseCard } from "./_components/phrase-card";

export default async function StudentDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Fetch User Profile & Organization Context
  const { data: profile } = await supabase
    .from("profiles")
    .select(`
      full_name, 
      organization_id,
      group_id,
      groups(name),
      quiz_attempts(score, created_at)
    `)
    .eq("id", user?.id)
    .single() as any; // Assert as any to fix the 'never' type error during build

  // 2. Fetch Group Stats (Collective Performance)
  let groupAverage = 0;
  let teammatesCount = 0;
  if (profile?.group_id) {
    const { data: groupData } = await supabase
      .from("profiles")
      .select("quiz_attempts(score)")
      .eq("group_id", profile.group_id);
    
    const allScores = groupData?.flatMap(p => p.quiz_attempts.map(a => (a as any).score)) || [];
    groupAverage = allScores.length > 0 ? (allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;
    teammatesCount = (groupData?.length || 1);
  }

  // 3. Fetch Next Upcoming Organization-Wide Meeting
  let nextMeeting = null;
  if (profile?.organization_id) {
    const { data: meetingData } = await supabase
      .from("meetings")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .gte("start_time", new Date().toISOString())
      .order("start_time", { ascending: true })
      .limit(1)
      .maybeSingle();
    nextMeeting = meetingData;
  }

  // 4. Fetch Bilingual Phrase of the Day
  const { data: phrases } = await supabase
    .from("daily_phrases")
    .select("text, text_fr, author");

  const dailyPhrase = phrases && phrases.length > 0 
    ? phrases[Math.floor(Math.random() * phrases.length)] 
    : null;

  // Helper to handle Supabase join array vs object safely for TypeScript
  const displayGroupName = Array.isArray(profile?.groups) 
    ? profile?.groups[0]?.name 
    : profile?.groups?.name;

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] dark:bg-[#0F172A] transition-colors overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar pb-24">
          <div className="max-w-6xl mx-auto space-y-8">
            
            {/* 1. WELCOME SECTION */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Welcome back, {profile?.full_name?.split(" ")[0] || "Scholar"}
                </h1>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  Ready to continue your training? Here is your current status.
                </p>
              </div>
              
              <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">
                <div className="w-10 h-10 bg-violet-500/10 rounded-lg flex items-center justify-center text-violet-600">
                  <Award className="w-5 h-5" />
                </div>
                <div className="pr-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Rank</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Top 12%</p>
                </div>
              </div>
            </div>

            {/* 2. CORE STATS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard 
                title="Personal Best" 
                value={profile?.quiz_attempts?.[0]?.score || 0} 
                unit="/ 20 Pts"
                icon={Target}
                color="text-emerald-500"
              />
              <StatCard 
                title="Formation Avg" 
                value={groupAverage.toFixed(1)} 
                unit="Pts"
                icon={Users}
                color="text-violet-600"
                subtitle={`${teammatesCount}/4 Members active`}
              />
              <StatCard 
                title="Arena Runs" 
                value={profile?.quiz_attempts?.length || 0} 
                unit="Attempts"
                icon={Zap}
                color="text-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <MeetingCard meeting={nextMeeting} />
                <PhraseCard phrase={dailyPhrase} />

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Learning Path</h3>
                    <Link href="/student-board/lessons" className="text-xs font-bold text-violet-600 hover:underline transition-all">View All</Link>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5 p-6 shadow-sm group cursor-pointer hover:border-violet-500/50 transition-all">
                    <div className="flex gap-6">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 flex-shrink-0 transition-colors group-hover:bg-violet-50 dark:group-hover:bg-violet-900/10 group-hover:text-violet-600">
                        <BookOpen className="w-8 h-8" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-bold bg-violet-100 dark:bg-violet-500/10 text-violet-600 px-2 py-0.5 rounded-md uppercase tracking-widest">Current Module</span>
                          <span className="text-xs font-medium text-slate-400">4 of 12 lessons</span>
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">English Mastery Foundations</h4>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                          <div className="bg-violet-600 h-full w-1/3 rounded-full" />
                        </div>
                      </div>
                      <div className="flex items-center">
                        <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-violet-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                 <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-violet-600" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">Formation Ranking</h3>
                 </div>
                 
                 <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5 p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                       <span className="text-xs font-bold text-slate-400">#1</span>
                       <span className="text-xs font-bold text-slate-900 dark:text-white truncate mx-4">Elite Formation</span>
                       <span className="text-xs font-bold text-emerald-500 ml-auto">18.4</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-violet-500/20 bg-violet-500/5 rounded-lg">
                       <span className="text-xs font-bold text-violet-600">#2</span>
                       <span className="text-xs font-bold text-slate-900 dark:text-white truncate mx-4">{displayGroupName || "Your Team"}</span>
                       <span className="text-xs font-bold text-violet-600 ml-auto">{groupAverage.toFixed(1)}</span>
                    </div>
                    <Link href="/protected/student-board/ranking" className="block text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] pt-2 hover:text-violet-600 transition-colors">
                      Enter the Arena
                    </Link>
                 </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function StatCard({ title, value, unit, icon: Icon, color, subtitle }: any) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5 p-6 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50", color)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{title}</p>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</span>
          <span className="text-xs font-medium text-slate-500">{unit}</span>
        </div>
        {subtitle && (
          <p className="text-[10px] font-medium text-slate-400 mt-2">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
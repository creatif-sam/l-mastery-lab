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
  Star,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { MeetingCard } from "./components/home/meeting-card";
import { PhraseCard } from "./components/home/phrase-of-day";
import { MeetingCalendar } from "./components/home/meeting-calendar";

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
      community_points,
      avatar_url,
      country_birth,
      country_residence,
      target_language,
      groups(name),
      quiz_attempts(score, created_at)
    `)
    .eq("id", user?.id)
    .single() as any; // Assert as any to fix the 'never' type error during build

  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    if (!profile) return 0;
    // Don't count organization_id for completion - it's optional for OAuth users
    const fields = [
      profile.full_name,
      profile.avatar_url,
      profile.country_birth,
      profile.country_residence,
      profile.target_language
    ];
    // Check for both empty strings and null/undefined
    const completed = fields.filter(field => {
      if (field === null || field === undefined) return false;
      if (typeof field === 'string' && field.trim() === '') return false;
      return true;
    }).length;
    return Math.round((completed / fields.length) * 100);
  };

  const profileCompletion = calculateProfileCompletion();

  // 2. Fetch lessons completed by user
  const { count: lessonsCompleted } = await supabase
    .from("user_lesson_progress")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user?.id)
    .eq("completed", true);

  // 3. Fetch community posts count for this user
  const { count: communityPostsCount } = await supabase
    .from("community_posts")
    .select("*", { count: "exact", head: true })
    .eq("author_id", user?.id);

  // 4. Fetch Group Stats (Collective Performance)
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

  // 5. Global XP Rank
  const { data: profileXpRow } = await supabase.from("profiles").select("xp").eq("id", user?.id).single() as any;
  const userXp = profileXpRow?.xp ?? 0;
  const [{ count: usersAhead }, { count: totalForRank }] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).gt("xp", userXp),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
  ]);
  const rankPercent = totalForRank && totalForRank > 0
    ? Math.max(1, Math.round(((usersAhead ?? 0) + 1) / totalForRank * 100))
    : null;
  const globalRankLabel = rankPercent ? `Top ${rankPercent}%` : "Unranked";

  // 6. Next Lesson to complete
  const { data: allLessons } = await supabase
    .from("lessons")
    .select("id, title, order_index")
    .order("order_index", { ascending: true })
    .limit(30);
  const totalLessonsCount = allLessons?.length ?? 0;
  const { data: completedProgress } = await supabase
    .from("user_lesson_progress")
    .select("lesson_id")
    .eq("user_id", user?.id)
    .eq("completed", true);
  const completedIds = new Set((completedProgress ?? []).map((p: any) => p.lesson_id));
  const nextLesson = allLessons?.find((l: any) => !completedIds.has(l.id)) ?? allLessons?.[0] ?? null;

  // 7. Top groups for formation ranking
  const { data: allGroups } = await supabase.from("groups").select("id, name").limit(10);
  let topGroups: { id: string; name: string; avgScore: number }[] = [];
  if (allGroups && allGroups.length > 0) {
    const groupScores = await Promise.all(
      allGroups.map(async (g: any) => {
        const { data: members } = await supabase
          .from("profiles")
          .select("quiz_attempts(score)")
          .eq("group_id", g.id);
        const scores = members?.flatMap((m: any) => m.quiz_attempts.map((a: any) => a.score)) ?? [];
        const avg = scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0;
        return { id: g.id, name: g.name, avgScore: avg };
      })
    );
    topGroups = groupScores.sort((a, b) => b.avgScore - a.avgScore).slice(0, 3);
  }

  // 3. Fetch Next Upcoming Meetings (organization or group-based)
  let nextMeeting = null;
  let allOrgMeetings: any[] = [];
  const now = new Date().toISOString();
  
  // Build meeting query based on user's organization or group
  let meetingQuery = supabase
    .from("meetings")
    .select("*")
    .gte("start_time", now)
    .order("start_time", { ascending: true });
  
  if (profile?.organization_id) {
    meetingQuery = meetingQuery.eq("organization_id", profile.organization_id);
  }
  
  // Fetch next single meeting for the card
  const { data: meetingData } = await meetingQuery.limit(1).maybeSingle();
  nextMeeting = meetingData;

  // Fetch all meetings for the next 3 months for the calendar
  const threeMonthsOut = new Date();
  threeMonthsOut.setMonth(threeMonthsOut.getMonth() + 3);
  
  let calendarQuery = supabase
    .from("meetings")
    .select("id, title, platform, meeting_link, start_time")
    .gte("start_time", now)
    .lte("start_time", threeMonthsOut.toISOString())
    .order("start_time", { ascending: true });
  
  if (profile?.organization_id) {
    calendarQuery = calendarQuery.eq("organization_id", profile.organization_id);
  }
  
  const { data: calMeetings } = await calendarQuery;
  allOrgMeetings = calMeetings ?? [];

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
            
            {/* PROFILE COMPLETION BANNER */}
            {profileCompletion < 100 && (
              <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl border border-red-400 p-6 shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-black text-white mb-2">
                      Complete Your Profile ({profileCompletion}%)
                    </h3>
                    <p className="text-sm text-red-50 mb-3">
                      Please complete your profile to unlock all functionalities and get the best experience.
                    </p>
                    <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden mb-3">
                      <div 
                        className="h-full bg-white rounded-full transition-all"
                        style={{ width: `${profileCompletion}%` }}
                      />
                    </div>
                    <Link 
                      href="/protected/student-board/settings"
                      className="inline-flex items-center gap-2 bg-white text-red-600 font-bold px-4 py-2 rounded-lg hover:bg-red-50 transition-all text-sm"
                    >
                      <User className="w-4 h-4" />
                      Complete Profile Now
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* 1. WELCOME SECTION */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Welcome back, {profile?.full_name?.split(" ")[0] || "Scholar"}
                </h1>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  Ready to continue your French mastery Journey? Here is your current status.
                </p>
              </div>
              
              <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">
                <div className="w-10 h-10 bg-violet-500/10 rounded-lg flex items-center justify-center text-violet-600">
                  <Award className="w-5 h-5" />
                </div>
                <div className="pr-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Rank</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{globalRankLabel}</p>
                </div>
              </div>
            </div>

            {/* 2. CORE STATS GRID */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard 
                title="Best Score" 
                value={profile?.quiz_attempts?.reduce((b: number, a: any) => Math.max(b, a.score ?? 0), 0) || 0} 
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
                subtitle={`${teammatesCount} members`}
              />
              <StatCard 
                title="Arena Runs" 
                value={profile?.quiz_attempts?.length || 0} 
                unit="Attempts"
                icon={Zap}
                color="text-amber-500"
              />
              <StatCard 
                title="Community Pts" 
                value={(profile?.community_points ?? 0).toFixed(1)} 
                unit="Pts"
                icon={Star}
                color="text-pink-500"
                subtitle={`${communityPostsCount ?? 0} posts`}
                href="/protected/student-board/community"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <MeetingCard meeting={nextMeeting} />
                <MeetingCalendar meetings={allOrgMeetings} />
                <PhraseCard phrase={dailyPhrase} />

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Learning Path</h3>
                    <Link href="/protected/student-board/lessons" className="text-xs font-bold text-violet-600 hover:underline transition-all">View All</Link>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5 p-6 shadow-sm group cursor-pointer hover:border-violet-500/50 transition-all">
                    <div className="flex gap-6">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 flex-shrink-0 transition-colors group-hover:bg-violet-50 dark:group-hover:bg-violet-900/10 group-hover:text-violet-600">
                        <BookOpen className="w-8 h-8" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-bold bg-violet-100 dark:bg-violet-500/10 text-violet-600 px-2 py-0.5 rounded-md uppercase tracking-widest">Current Module</span>
                          <span className="text-xs font-medium text-slate-400">{lessonsCompleted ?? 0} of {totalLessonsCount} lessons</span>
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">{nextLesson?.title ?? "No lessons yet"}</h4>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                          <div className="bg-violet-600 h-full rounded-full transition-all" style={{ width: totalLessonsCount > 0 ? `${Math.round(((lessonsCompleted ?? 0) / totalLessonsCount) * 100)}%` : "0%" }} />
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
                 
                 <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5 p-5 shadow-sm space-y-3">
                    {topGroups.length > 0 ? topGroups.map((g, i) => {
                      const isMyGroup = g.id === profile?.group_id;
                      return (
                        <div key={g.id} className={`flex items-center justify-between p-3 rounded-lg ${
                          isMyGroup
                            ? "border border-violet-500/20 bg-violet-500/5"
                            : "bg-slate-50 dark:bg-slate-800/50"
                        }`}>
                          <span className={`text-xs font-bold ${ isMyGroup ? "text-violet-600" : "text-slate-400" }`}>#{i + 1}</span>
                          <span className={`text-xs font-bold truncate mx-4 ${ isMyGroup ? "text-violet-700 dark:text-violet-300" : "text-slate-900 dark:text-white" }`}>
                            {g.name}{isMyGroup ? " (You)" : ""}
                          </span>
                          <span className={`text-xs font-bold ml-auto ${ isMyGroup ? "text-violet-600" : "text-emerald-500" }`}>
                            {g.avgScore.toFixed(1)}
                          </span>
                        </div>
                      );
                    }) : (
                      <div className="flex items-center justify-between p-3 border border-violet-500/20 bg-violet-500/5 rounded-lg">
                        <span className="text-xs font-bold text-violet-600">#1</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate mx-4">{displayGroupName || "Your Team"}</span>
                        <span className="text-xs font-bold text-violet-600 ml-auto">{groupAverage.toFixed(1)}</span>
                      </div>
                    )}
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

function StatCard({ title, value, unit, icon: Icon, color, subtitle, href }: any) {
  const content = (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5 p-5 shadow-sm hover:shadow-md transition-all h-full">
      <div className="flex items-center justify-between mb-3">
        <div className={cn("p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50", color)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{title}</p>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</span>
          <span className="text-xs font-medium text-slate-500">{unit}</span>
        </div>
        {subtitle && (
          <p className="text-[10px] font-medium text-slate-400 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
  if (href) return <Link href={href} className="block h-full">{content}</Link>;
  return content;
}
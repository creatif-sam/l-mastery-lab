import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "../components/sidebar";
import { Header } from "../components/header";
import { 
  Trophy, 
  Crown, 
  Building2, 
  Star, 
  BookOpen, 
  Target, 
  BarChart3,
  Calculator,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

export default async function OrganizationRankingPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, full_name")
    .eq("id", user?.id)
    .single();

  const { data: org } = await supabase
    .from("organizations")
    .select("name, logo_url")
    .eq("id", profile?.organization_id)
    .single();

  // 1. FETCH DATA FOR CALCULATION
  // Quiz: Fetch all top scores from the leaderboard view
  // Show organization-specific if user has org, otherwise show global rankings
  let quizQuery = supabase
    .from("org_leaderboard")
    .select("top_score, full_name, profile_id, organization_id");
  
  if (profile?.organization_id) {
    quizQuery = quizQuery.eq("organization_id", profile.organization_id);
  }
  
  const { data: quizData } = await quizQuery;

  // Learning: Fetch all completion counts for users
  // Show organization-specific if user has org, otherwise show global rankings
  let learningQuery = supabase
    .from("profiles")
    .select(`id, full_name, organization_id, user_lesson_progress!inner(lesson_id, completed)`);
  
  if (profile?.organization_id) {
    learningQuery = learningQuery.eq("organization_id", profile.organization_id);
  }
  
  // Only count completed lessons
  learningQuery = learningQuery.eq("user_lesson_progress.completed", true);
  
  const { data: learningData } = await learningQuery;

  // 2. 🧮 CALCULATION LOGIC (Sum of all / Total count)
  const quizCount = quizData?.length || 0;
  const totalQuizPoints = quizData?.reduce((sum, p) => sum + (p.top_score || 0), 0) || 0;
  const avgQuizScore = quizCount > 0 ? (totalQuizPoints / quizCount).toFixed(1) : "0.0";

  // Group learning data by user and count completed lessons
  const learningCount = learningData?.length || 0;
  const userLessonsMap = new Map<string, number>();
  
  learningData?.forEach((record: any) => {
    const userId = record.id;
    const lessonCount = Array.isArray(record.user_lesson_progress) 
      ? record.user_lesson_progress.length 
      : 0;
    userLessonsMap.set(userId, lessonCount);
  });
  
  const totalModulesCompleted = Array.from(userLessonsMap.values()).reduce((sum, count) => sum + count, 0);
  const avgModules = learningCount > 0 ? (totalModulesCompleted / learningCount).toFixed(1) : "0.0";

  // 3. FORMAT RANKINGS (Sort Top 10)
  const quizLeaderboard = [...(quizData || [])]
    .sort((a, b) => b.top_score - a.top_score)
    .slice(0, 10);

  const learningLeaderboard = learningData
    ?.map((p: any) => ({
      id: p.id,
      full_name: p.full_name,
      completed_count: Array.isArray(p.user_lesson_progress) ? p.user_lesson_progress.length : 0
    }))
    .filter((p: any) => p.completed_count > 0) // Only show users with at least 1 completed lesson
    .sort((a, b) => b.completed_count - a.completed_count)
    .slice(0, 10) || [];

  const logoUrl = org?.logo_url 
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/organization-logos/${org.logo_url}`
    : null;

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] dark:bg-[#0F172A] transition-colors overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar pb-24">
          <div className="max-w-6xl mx-auto space-y-10">
            
            {/* 🏢 BRANDING HEADER */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-white/10 flex items-center justify-center shrink-0">
                  {logoUrl ? (
                    <Image src={logoUrl} alt="Logo" width={80} height={80} className="object-cover" unoptimized />
                  ) : (
                    <Building2 className="w-10 h-10 text-slate-400" />
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                    {org?.name || "Global Rankings"}
                  </h1>
                  <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mt-1">
                    {profile?.organization_id ? "L-Mastery Institutional Benchmarks" : "L-Mastery Global Leaderboard"}
                  </p>
                </div>
              </div>
            </div>

            {/* NOTICE FOR USERS WITHOUT ORGANIZATION */}
            {!profile?.organization_id && (
              <div className="bg-gradient-to-r from-blue-500 to-violet-600 rounded-2xl border border-blue-400 p-6 shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-black text-white mb-2">
                      Join an Organization to See Your Teammates
                    </h3>
                    <p className="text-sm text-blue-50 mb-3">
                      You're currently viewing global rankings. To see how you compare with your classmates and organization members, please complete your profile and join an organization.
                    </p>
                    <Link 
                      href="/protected/student-board/settings"
                      className="inline-flex items-center gap-2 bg-white text-violet-600 font-bold px-4 py-2 rounded-lg hover:bg-blue-50 transition-all text-sm"
                    >
                      <Building2 className="w-4 h-4" />
                      Complete Profile
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* 🏆 QUIZ RANKING SECTION */}
              <section className="space-y-4">
                <div className="flex flex-col gap-1 px-2">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" /> Quiz Ranking
                  </h2>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="bg-amber-500/10 text-amber-600 px-3 py-1.5 rounded-xl flex items-center gap-2">
                      <Calculator className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase">Avg Marks: {avgQuizScore}</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{quizCount} Contributors</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm">
                  {quizLeaderboard.map((player, idx) => (
                    <RankRow 
                      key={player.profile_id} 
                      name={player.full_name} 
                      score={player.top_score} 
                      rank={idx + 1} 
                      unit="Pts"
                      icon={idx === 0 ? <Crown className="w-4 h-4 text-amber-500" /> : null}
                    />
                  ))}
                </div>
              </section>

              {/* 📖 LEARNING RANKING SECTION */}
              <section className="space-y-4">
                <div className="flex flex-col gap-1 px-2">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-violet-600" /> Learning Ranking
                  </h2>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="bg-violet-600/10 text-violet-600 px-3 py-1.5 rounded-xl flex items-center gap-2">
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase">Avg Modules: {avgModules}</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{learningCount} Active Learners</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm">
                  {learningLeaderboard.map((player, idx) => (
                    <RankRow 
                      key={player.id} 
                      name={player.full_name} 
                      score={player.completed_count} 
                      rank={idx + 1} 
                      unit="Modules"
                      icon={idx === 0 ? <Star className="w-4 h-4 text-violet-500 fill-violet-500" /> : null}
                    />
                  ))}
                </div>
              </section>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function RankRow({ name, score, rank, unit, icon }: any) {
  return (
    <div className="flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors border-b last:border-0 border-slate-100 dark:border-white/5">
      <div className="flex items-center gap-4">
        <span className={cn(
          "text-[10px] font-black w-6",
          rank <= 3 ? "text-violet-600" : "text-slate-300"
        )}>#{rank}</span>
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-500 text-xs uppercase border border-slate-200 dark:border-white/5 shadow-sm">
          {name.charAt(0)}
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-slate-800 dark:text-white tracking-tight">{name}</p>
          {icon}
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-black text-slate-900 dark:text-white leading-none">{score}</p>
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">{unit}</p>
      </div>
    </div>
  );
}
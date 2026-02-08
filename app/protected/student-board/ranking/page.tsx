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
  Calculator
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

export default async function OrganizationRankingPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user?.id)
    .single();

  const { data: org } = await supabase
    .from("organizations")
    .select("name, logo_url")
    .eq("id", profile?.organization_id)
    .single();

  // 1. FETCH DATA FOR CALCULATION
  // Quiz: Fetch all top scores from the leaderboard view
  const { data: quizData } = await supabase
    .from("org_leaderboard")
    .select("top_score, full_name, profile_id")
    .eq("organization_id", profile?.organization_id);

  // Learning: Fetch all completion counts for all users in org
  const { data: learningData } = await supabase
    .from("profiles")
    .select(`id, full_name, user_lesson_progress(count)`)
    .eq("organization_id", profile?.organization_id)
    .eq("user_lesson_progress.is_completed", true);

  // 2. 🧮 CALCULATION LOGIC (Sum of all / Total count)
  const quizCount = quizData?.length || 0;
  const totalQuizPoints = quizData?.reduce((sum, p) => sum + (p.top_score || 0), 0) || 0;
  const avgQuizScore = quizCount > 0 ? (totalQuizPoints / quizCount).toFixed(1) : "0.0";

  const learningCount = learningData?.length || 0;
  const totalModulesCompleted = learningData?.reduce((sum, p) => sum + (p.user_lesson_progress?.[0]?.count || 0), 0) || 0;
  const avgModules = learningCount > 0 ? (totalModulesCompleted / learningCount).toFixed(1) : "0.0";

  // 3. FORMAT RANKINGS (Sort Top 10)
  const quizLeaderboard = [...(quizData || [])]
    .sort((a, b) => b.top_score - a.top_score)
    .slice(0, 10);

  const learningLeaderboard = learningData
    ?.map((p: any) => ({
      id: p.id,
      full_name: p.full_name,
      completed_count: p.user_lesson_progress?.[0]?.count || 0
    }))
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
                    {org?.name || "Mastery Lab Org"}
                  </h1>
                  <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mt-1">L-Mastery Institutional Benchmarks</p>
                </div>
              </div>
            </div>

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
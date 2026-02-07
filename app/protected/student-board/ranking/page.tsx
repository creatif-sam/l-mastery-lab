import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "../components/sidebar";
import { Header } from "../components/header";
import { Trophy, Medal, Crown, Users, TrendingUp, Building2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

export default async function OrganizationRankingPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, group_id")
    .eq("id", user?.id)
    .single();

  const { data: org } = await supabase
    .from("organizations")
    .select("name, logo_url")
    .eq("id", profile?.organization_id)
    .single();

  const { count: totalMembers } = await supabase
    .from("profiles")
    .select("*", { count: 'exact', head: true })
    .eq("organization_id", profile?.organization_id);

  const { data: leaderboard } = await supabase
    .from("org_leaderboard")
    .select("*")
    .eq("organization_id", profile?.organization_id)
    .order("top_score", { ascending: false })
    .limit(40);

  const { data: formationRankings } = await supabase
    .from("profiles")
    .select(`
      group_id,
      groups!inner(name),
      quiz_attempts(score)
    `)
    .eq("organization_id", profile?.organization_id)
    .not("group_id", "is", null);

  const groupStats = formationRankings?.reduce((acc: any, curr: any) => {
    const groupId = curr.group_id;
    if (!acc[groupId]) {
      acc[groupId] = { name: curr.groups.name, totalScore: 0, count: 0 };
    }
    curr.quiz_attempts?.forEach((attempt: any) => {
      acc[groupId].totalScore += attempt.score;
      acc[groupId].count += 1;
    });
    return acc;
  }, {});

  const sortedFormations = Object.values(groupStats || {})
    .map((g: any) => ({
      name: g.name,
      avgScore: g.count > 0 ? (g.totalScore / g.count).toFixed(1) : 0
    }))
    .sort((a: any, b: any) => (b as any).avgScore - (a as any).avgScore);

  const topThree = leaderboard?.slice(0, 3) || [];
  const others = leaderboard?.slice(3) || [];

  const logoUrl = org?.logo_url 
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/organization-logos/${org.logo_url}`
    : null;

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] dark:bg-[#0F172A] transition-colors overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar pb-24">
          <div className="max-w-6xl mx-auto space-y-8">
            
            {/* 🏢 BRANDING HEADER */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm p-6 flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-100 dark:border-white/10 flex items-center justify-center">
                  {logoUrl ? (
                    <Image src={logoUrl} alt="Logo" width={64} height={64} className="object-cover" unoptimized />
                  ) : (
                    <Building2 className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="w-3 h-3 text-violet-500 fill-violet-500" />
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Official Organization</span>
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {org?.name || "Private Organization"}
                  </h1>
                </div>
              </div>
              <div className="mt-4 md:mt-0 px-6 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-white/10 text-center">
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Total Members</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{totalMembers || 0}</p>
              </div>
            </div>

            {/* 🛡️ FORMATION RANKINGS */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-violet-600" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">Formation Power Rankings</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {sortedFormations.slice(0, 4).map((form: any, idx) => (
                  <div key={form.name} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-5 rounded-xl shadow-sm relative overflow-hidden group">
                    <span className="absolute right-4 top-4 text-xs font-bold text-slate-200 dark:text-slate-800">#{idx + 1}</span>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">{form.name}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-slate-900 dark:text-white">{form.avgScore}</span>
                      <span className="text-[10px] font-medium text-slate-500">Avg Pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 🏆 INDIVIDUAL PODIUM */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
               {topThree[1] && <PodiumCard player={topThree[1]} rank={2} />}
               {topThree[0] && <PodiumCard player={topThree[0]} rank={1} isMain />}
               {topThree[2] && <PodiumCard player={topThree[2]} rank={3} />}
            </div>

            {/* 📊 FULL TABLE */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-violet-600" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white">Individual Leaderboard</h3>
                </div>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {others.map((player, index) => (
                  <div key={player.profile_id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-medium text-slate-400 w-6">#{index + 4}</span>
                      <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 uppercase">
                        {player.full_name.charAt(0)}
                      </div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white tracking-tight">{player.full_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-violet-600 leading-none">{player.top_score}</p>
                      <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mt-1">Points</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

function PodiumCard({ player, rank, isMain }: { player: any, rank: number, isMain?: boolean }) {
  const colors = [
    { text: "text-amber-600", bg: "bg-amber-50", darkBg: "dark:bg-amber-900/10" },
    { text: "text-slate-500", bg: "bg-slate-50", darkBg: "dark:bg-slate-800/10" },
    { text: "text-orange-700", bg: "bg-orange-50", darkBg: "dark:bg-orange-900/10" }
  ];
  
  const current = colors[rank - 1];

  return (
    <div className={cn(
      "relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl p-6 text-center shadow-sm transition-transform hover:-translate-y-1",
      isMain ? "md:pb-10 pt-10 ring-2 ring-violet-500/10" : "md:pb-6"
    )}>
      <div className={cn("w-12 h-12 mx-auto rounded-lg flex items-center justify-center mb-4", current.bg, current.darkBg)}>
        {rank === 1 ? <Crown className={cn("w-6 h-6", current.text)} /> : <Medal className={cn("w-6 h-6", current.text)} />}
      </div>
      
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight truncate px-2">
          {player.full_name}
        </h3>
        <p className={cn("text-3xl font-bold tracking-tight", current.text)}>
          {player.top_score}
        </p>
      </div>

      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-white/10 text-[9px] font-bold uppercase tracking-wider text-slate-500">
        Rank {rank}
      </div>
    </div>
  );
}
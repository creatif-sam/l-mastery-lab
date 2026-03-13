import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "../components/sidebar";
import { Header } from "../components/header";
import { TeamSidebar } from "../components/network/team-sidebar";
import { SearchableGrid } from "../components/network/searchable-grid";

export default async function NetworkPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Get My Profile (including new LinkedIn-style fields)
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("id, organization_id, group_id, full_name, title, bio, collaboration_target, avatar_url, role, xp, level")
    .eq("id", user?.id)
    .single();

  // 2. Fetch Sent Pending Requests to show "Withdraw"
  const { data: sentRequests } = await supabase
    .from("partner_requests")
    .select("id, receiver_id")
    .eq("sender_id", user?.id)
    .eq("status", "pending");

  // 3. Fetch Teammates for Sidebar Intelligence
  let teammates: any[] = [];
  if (myProfile?.group_id) {
    const { data } = await supabase
      .from("profiles")
      .select(`
        id, full_name, avatar_url, updated_at,
        attempts:quiz_attempts(score, completed_at)
      `)
      .eq("group_id", myProfile.group_id)
      .not("id", "eq", user?.id);
    teammates = data || [];
  }

  // 4. Fetch Organization Members (with new LinkedIn-style fields)
  let membersQuery = supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role, xp, level, organization_id, updated_at, title, bio, collaboration_target, group_id")
    .not("id", "eq", user?.id)
    .order("updated_at", { ascending: false });

  if (myProfile?.organization_id) {
    membersQuery = membersQuery.eq("organization_id", myProfile.organization_id);
  }

  const { data: members } = await membersQuery;

  // 5. Calculate Capacity (Min 3 / Max 4 logic)
  const isMyGroupFull = (teammates.length + 1) >= 4;

  return (
    <div className="flex min-h-screen bg-[#F3F2EF] dark:bg-[#1D2226] overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-[1400px] mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* LEFT: MY PROFILE CARD (LinkedIn Style) */}
            <div className="lg:col-span-3 space-y-4 hidden xl:block">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm">
                <div className="h-20 bg-gradient-to-r from-violet-600 to-indigo-600 relative">
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                    <div className="w-16 h-16 rounded-full border-4 border-white dark:border-slate-900 bg-[#003366] text-white flex items-center justify-center font-black text-xl shadow-md overflow-hidden">
                      {myProfile?.avatar_url ? (
                        <img src={myProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        myProfile?.full_name?.[0]
                      )}
                    </div>
                  </div>
                </div>
                <div className="px-4 pt-12 pb-5 text-center border-b border-slate-100 dark:border-white/5">
                  <h3 className="font-black text-slate-900 dark:text-white text-sm tracking-tight">{myProfile?.full_name}</h3>
                  <p className="text-[11px] text-violet-600 dark:text-violet-400 font-semibold mt-0.5">
                    {myProfile?.title || "Language Learner"}
                  </p>
                  {myProfile?.bio && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed line-clamp-3">{myProfile.bio}</p>
                  )}
                  <div className="flex items-center justify-center gap-3 mt-3">
                    <div className="text-center">
                      <p className="text-sm font-black text-slate-800 dark:text-white">{myProfile?.xp ?? 0}</p>
                      <p className="text-[9px] text-slate-400 uppercase font-bold">XP</p>
                    </div>
                    <div className="w-px h-6 bg-slate-200 dark:bg-white/10" />
                    <div className="text-center">
                      <p className="text-sm font-black text-slate-800 dark:text-white">Lv.{myProfile?.level ?? 1}</p>
                      <p className="text-[9px] text-slate-400 uppercase font-bold">Level</p>
                    </div>
                  </div>
                </div>
                {myProfile?.collaboration_target && (
                  <div className="px-4 py-3">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Open To</p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold leading-relaxed">
                      {myProfile.collaboration_target}
                    </p>
                  </div>
                )}
              </div>

              {/* Profile Completion Hint */}
              {(!myProfile?.title || !myProfile?.bio || !myProfile?.collaboration_target) && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700/30 p-4">
                  <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 mb-1">Complete your profile</p>
                  <p className="text-[10px] text-amber-600/80 dark:text-amber-500/80 leading-relaxed">
                    Add a title, bio and collaboration intent so others know how to connect with you.
                  </p>
                </div>
              )}
            </div>

            {/* CENTER: SEARCHABLE MEMBERS GRID */}
            <div className="lg:col-span-12 xl:col-span-6 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5 p-5 shadow-sm">
                <h1 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Network</h1>
                <p className="text-xs text-slate-400 mt-0.5">Connect with learners in your organisation • Groups: 3–4 members</p>
              </div>

              <SearchableGrid
                members={members || []}
                userId={user?.id}
                sentRequests={sentRequests ?? undefined}
                isMyGroupFull={isMyGroupFull}
                myProfile={myProfile}
              />
            </div>

            {/* RIGHT: TEAM SIDEBAR (Desktop) */}
            <div className="lg:col-span-12 xl:col-span-3 hidden lg:block">
              <TeamSidebar teammates={teammates} />
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "../components/sidebar";
import  { Header } from "../components/header";
import { MoreHorizontal } from "lucide-react";
import { TeamSidebar } from "../components/network/team-sidebar";
import { SearchableGrid } from "../components/network/searchable-grid";

export default async function NetworkPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Get My Profile
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("organization_id, group_id, full_name")
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

  // 4. Fetch Organization Members
  const { data: members } = await supabase
    .from("organization_network")
    .select("*")
    .eq("organization_id", myProfile?.organization_id)
    .order("last_online", { ascending: false });

  // 5. Calculate Capacity (Min 3 / Max 4 logic)
  const isMyGroupFull = (teammates.length + 1) >= 4;

  return (
    <div className="flex min-h-screen bg-[#F3F2EF] dark:bg-[#1D2226] overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        
        {/* MOBILE TEAM STRIP (Optional - for high-speed access on phones) */}
        <div className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/5 px-4 py-3 flex gap-4 overflow-x-auto no-scrollbar">
          {teammates.length > 0 ? (
             teammates.map(mate => (
              <div key={mate.id} className="flex-shrink-0 flex items-center gap-2 bg-slate-50 dark:bg-white/5 px-3 py-1.5 rounded-full border border-slate-100 dark:border-white/10">
                <div className="w-5 h-5 rounded-full bg-violet-600 text-[8px] flex items-center justify-center text-white font-black">{mate.full_name[0]}</div>
                <span className="text-[10px] font-black text-[#003366] dark:text-white uppercase truncate max-w-[80px]">{mate.full_name.split(' ')[0]}</span>
              </div>
            ))
          ) : (
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-1">No Active Formation</p>
          )}
        </div>

        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-[1400px] mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT: MINI PROFILE (LinkedIn Style) */}
            <div className="lg:col-span-3 space-y-4 hidden xl:block">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm">
                <div className="h-14 bg-gradient-to-r from-violet-600 to-indigo-600" />
                <div className="px-4 pb-6 -mt-8 text-center">
                  <div className="w-16 h-16 rounded-full border-4 border-white dark:border-slate-900 bg-[#003366] text-white flex items-center justify-center mx-auto font-black text-xl shadow-md">
                    {myProfile?.full_name?.[0]}
                  </div>
                  <h3 className="mt-3 font-bold text-slate-900 dark:text-white uppercase text-sm tracking-tight">{myProfile?.full_name}</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Specialist</p>
                </div>
              </div>
            </div>

            {/* CENTER: SEARCHABLE MEMBERS GRID */}
            <div className="lg:col-span-12 xl:col-span-6 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5 p-6 flex items-center justify-between shadow-sm">
                <div>
                  <h1 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">Arena Network</h1>
                  <p className="text-xs text-slate-500">Group Requirements: 3 Minimum • 4 Maximum</p>
                </div>
                <MoreHorizontal className="text-slate-400 w-5 h-5 cursor-pointer" />
              </div>

              {/* Real-time Search and Member Grid */}
              <SearchableGrid 
                members={members || []} 
                userId={user?.id}
                sentRequests={sentRequests}
                isMyGroupFull={isMyGroupFull}
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
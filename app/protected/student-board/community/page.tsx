import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "../components/sidebar";
import { Header } from "../components/header";
import { CommunityClient } from "./community-client";
import { CommunityVisitTracker } from "./community-visit-tracker";

export default async function CommunityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, organization_id, community_points, role, avatar_url")
    .eq("id", user.id)
    .single() as any;

  // Fetch posts from same org (or all if no org)
  let postsQuery = supabase
    .from("community_posts")
    .select(`
      id, content, image_url, likes_count, loves_count, comments_count, created_at,
      author:profiles!community_posts_author_id_fkey(id, full_name, role, community_points, avatar_url)
    `)
    .order("created_at", { ascending: false })
    .limit(30);

  if (profile?.organization_id) {
    postsQuery = postsQuery.eq("organization_id", profile.organization_id);
  }

  const { data: posts } = await postsQuery;

  // Fetch user's existing reactions
  const { data: myReactions } = await supabase
    .from("community_reactions")
    .select("post_id, type")
    .eq("user_id", user.id);

  // Top community members by points (same org)
  let leaderboardQuery = supabase
    .from("profiles")
    .select("id, full_name, community_points, role, avatar_url")
    .order("community_points", { ascending: false })
    .limit(5);

  if (profile?.organization_id) {
    leaderboardQuery = leaderboardQuery.eq("organization_id", profile.organization_id);
  }
  const { data: leaderboard } = await leaderboardQuery;

  // Fetch all org members for @mention autocomplete
  let membersQuery = supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role");
  if (profile?.organization_id) {
    membersQuery = membersQuery.eq("organization_id", profile.organization_id) as any;
  }
  const { data: orgMembers } = await (membersQuery as any).limit(100);

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] dark:bg-[#0F172A] transition-colors">
      <CommunityVisitTracker />
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <CommunityClient
            currentUser={profile}
            initialPosts={posts ?? []}
            myReactions={myReactions ?? []}
            leaderboard={leaderboard ?? []}
            orgMembers={orgMembers ?? []}
          />
        </main>
      </div>
    </div>
  );
}

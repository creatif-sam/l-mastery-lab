import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TutorSidebar } from "../components/structure/sidebar";
import { TutorHeader } from "../components/structure/header";
import { CommunityClient } from "@/app/protected/student-board/community/community-client";

export default async function TutorCommunityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, organization_id, community_points, role, avatar_url")
    .eq("id", user.id)
    .single() as any;

  if (!profile || profile.role !== "tutor") return redirect("/");

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

  const [{ data: posts }, { data: myReactions }] = await Promise.all([
    postsQuery,
    supabase.from("community_reactions").select("post_id, type").eq("user_id", user.id),
  ]);

  let leaderboardQuery = supabase
    .from("profiles")
    .select("id, full_name, community_points, role, avatar_url")
    .order("community_points", { ascending: false })
    .limit(5);

  if (profile?.organization_id) {
    leaderboardQuery = leaderboardQuery.eq("organization_id", profile.organization_id);
  }

  const { data: leaderboard } = await leaderboardQuery;

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] dark:bg-[#0B0F1A]">
      <TutorSidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TutorHeader title="Community" subtitle="Share knowledge and connect with your organization" />
        <main className="flex-1 overflow-y-auto">
          <CommunityClient
            currentUser={profile}
            initialPosts={posts ?? []}
            myReactions={myReactions ?? []}
            leaderboard={leaderboard ?? []}
          />
        </main>
      </div>
    </div>
  );
}

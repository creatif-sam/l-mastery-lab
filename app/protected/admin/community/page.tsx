import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminSidebar } from "../components/structure/sidebar";
import { AdminHeader } from "../components/structure/header";
import { CommunityClient } from "@/app/protected/student-board/community/community-client";

export default async function AdminCommunityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, organization_id, community_points, role, avatar_url")
    .eq("id", user.id)
    .single() as any;

  if (!profile || profile.role !== "admin") return redirect("/");

  // Admin sees ALL posts across all organizations
  const [{ data: posts }, { data: myReactions }, { data: leaderboard }] = await Promise.all([
    supabase
      .from("community_posts")
      .select(`
        id, content, image_url, likes_count, loves_count, comments_count, created_at,
        author:profiles!community_posts_author_id_fkey(id, full_name, role, community_points, avatar_url)
      `)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("community_reactions").select("post_id, type").eq("user_id", user.id),
    supabase
      .from("profiles")
      .select("id, full_name, community_points, role, avatar_url")
      .order("community_points", { ascending: false })
      .limit(10),
  ]);

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] dark:bg-[#0B0F1A]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <AdminHeader title="Community" subtitle="Monitor all posts across the platform" />
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

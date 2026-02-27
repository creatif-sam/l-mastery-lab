import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TutorSidebar } from "../components/structure/sidebar";
import { TutorHeader } from "../components/structure/header";
import { BlogManagementClient } from "../../admin/blog/blog-client";

export default async function TutorBlogPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single();
  if (!profile || profile.role !== "tutor") return redirect("/");

  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id, title, excerpt, status, created_at, author_id, category, cover_image_url, profiles(full_name)")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  // Read stats for tutor's own posts
  const postIds = (posts ?? []).map((p: any) => p.id);
  let readStats: Record<string, { count: number; avgSeconds: number }> = {};
  if (postIds.length > 0) {
    const { data: readRows } = await supabase
      .from("blog_article_reads")
      .select("post_id, time_spent_seconds")
      .in("post_id", postIds);
    if (readRows) {
      readRows.forEach((r: any) => {
        if (!readStats[r.post_id]) readStats[r.post_id] = { count: 0, avgSeconds: 0 };
        readStats[r.post_id].count++;
        readStats[r.post_id].avgSeconds += r.time_spent_seconds ?? 0;
      });
      Object.keys(readStats).forEach((id) => {
        readStats[id].avgSeconds = Math.round(readStats[id].avgSeconds / readStats[id].count);
      });
    }
  }

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] dark:bg-[#0B0F1A]">
      <TutorSidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TutorHeader title="My Blog" subtitle="Create and manage your blog posts" />
        <main className="flex-1 overflow-y-auto p-6">
          <BlogManagementClient
            initialPosts={posts || []}
            authorId={user.id}
            authorName={profile.full_name}
            readStats={readStats}
          />
        </main>
      </div>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminSidebar } from "../components/structure/sidebar";
import { AdminHeader } from "../components/structure/header";
import { BlogManagementClient } from "./blog-client";

export default async function AdminBlogPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return redirect("/");

  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id, title, excerpt, status, created_at, author_id, category, cover_image_url, profiles(full_name)")
    .order("created_at", { ascending: false });

  // Read stats for each post
  const { data: readRows } = await supabase
    .from("blog_article_reads")
    .select("post_id, time_spent_seconds");

  const readStats: Record<string, { count: number; avgSeconds: number }> = {};
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

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] dark:bg-[#0B0F1A]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <AdminHeader title="Blog Management" subtitle="Create and manage blog posts for your platform" />
        <main className="flex-1 overflow-y-auto p-6">
          <BlogManagementClient
            initialPosts={(posts || []) as any[]}
            authorId={user.id}
            authorName={profile.full_name}
            readStats={readStats}
          />
        </main>
      </div>
    </div>
  );
}

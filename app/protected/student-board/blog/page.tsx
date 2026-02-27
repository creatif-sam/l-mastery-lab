import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "../components/sidebar";
import { Header } from "../components/header";
import Link from "next/link";
import { BookOpen, Clock, Tag } from "lucide-react";

export default async function StudentBlogPage() {
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id, title, excerpt, category, cover_image_url, created_at, author_id, profiles(full_name)")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  const categories = [...new Set((posts || []).map((p: any) => p.category).filter(Boolean))];

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] dark:bg-[#0F172A] transition-colors font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-5xl mx-auto space-y-6">

            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">Blog</h1>
              <p className="text-sm text-slate-500 mt-1">Tips, updates, and insights from your tutors and admins</p>
            </div>

            {/* Category pills */}
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {categories.map((cat: any) => (
                  <span key={cat} className="text-xs bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 px-3 py-1 rounded-full font-semibold capitalize flex items-center gap-1">
                    <Tag size={10} /> {cat.replace("-", " ")}
                  </span>
                ))}
              </div>
            )}

            {/* Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {(posts || []).map((post: any) => (
                <Link
                  key={post.id}
                  href={`/protected/student-board/blog/${post.id}`}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                >
                  {post.cover_image_url ? (
                    <div className="h-36 overflow-hidden">
                      <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  ) : (
                    <div className="h-36 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 flex items-center justify-center">
                      <BookOpen size={36} className="text-violet-300" />
                    </div>
                  )}
                  <div className="p-4">
                    {post.category && (
                      <span className="text-[10px] bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-full font-semibold capitalize">{post.category.replace("-", " ")}</span>
                    )}
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm mt-2 line-clamp-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{post.title}</h3>
                    {post.excerpt && <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">{post.excerpt}</p>}
                    <div className="flex items-center gap-3 mt-3 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1"><Clock size={9} /> {new Date(post.created_at).toLocaleDateString()}</span>
                      <span>By {post.profiles?.full_name || "Author"}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {(!posts || posts.length === 0) && (
              <div className="text-center py-16 text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5">
                <BookOpen size={40} className="mx-auto mb-3 text-slate-300" />
                <p className="font-medium">No blog posts yet</p>
                <p className="text-sm mt-1">Check back soon for updates from your tutors</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

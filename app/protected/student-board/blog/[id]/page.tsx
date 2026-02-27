import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "../../components/sidebar";
import { Header } from "../../components/header";
import { notFound } from "next/navigation";
import { BookOpen, Clock, ArrowLeft, Tag } from "lucide-react";
import Link from "next/link";

export default async function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("blog_posts")
    .select("id, title, excerpt, content, category, cover_image_url, created_at, author_id, status, profiles(full_name)")
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (!post) return notFound();

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] dark:bg-[#0F172A] transition-colors font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-3xl mx-auto">
            <Link href="/protected/student-board/blog" className="flex items-center gap-2 text-sm text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors mb-6 w-fit">
              <ArrowLeft size={14} /> Back to Blog
            </Link>

            {post.cover_image_url && (
              <div className="h-56 md:h-72 rounded-2xl overflow-hidden mb-6">
                <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm p-6 md:p-8">
              {post.category && (
                <span className="inline-flex items-center gap-1 text-xs bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 px-3 py-1 rounded-full font-semibold capitalize mb-4">
                  <Tag size={10} /> {post.category.replace("-", " ")}
                </span>
              )}

              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight mb-4">{post.title}</h1>

              <div className="flex items-center gap-4 text-xs text-slate-400 mb-6 pb-6 border-b border-slate-100 dark:border-white/5">
                <span className="flex items-center gap-1"><Clock size={11} /> {new Date(post.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                <span>By <span className="font-semibold text-slate-600 dark:text-slate-300">{(post.profiles as any)?.full_name || "Author"}</span></span>
              </div>

              {post.excerpt && <p className="text-base text-slate-600 dark:text-slate-400 font-medium italic mb-6 border-l-4 border-violet-400 pl-4">{post.excerpt}</p>}

              <div className="prose dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-violet-500 prose-img:rounded-xl text-slate-700 dark:text-slate-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: post.content || "<p>No content available.</p>" }}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

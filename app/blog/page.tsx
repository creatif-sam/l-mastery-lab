import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { BookOpen, ArrowRight, Calendar, Tag, UserCircle } from "lucide-react";

export default async function PublicBlogPage() {
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id, title, excerpt, category, cover_image_url, created_at, author:profiles!blog_posts_author_id_fkey(full_name, role)")
    .eq("status", "published")
    .order("created_at", { ascending: false }) as any;

  const blogPosts = posts ?? [];

  const categoryColors: Record<string, string> = {
    grammar: "bg-blue-100 dark:bg-blue-500/10 text-blue-600",
    vocabulary: "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600",
    culture: "bg-amber-100 dark:bg-amber-500/10 text-amber-600",
    tips: "bg-purple-100 dark:bg-purple-500/10 text-purple-600",
    news: "bg-red-100 dark:bg-red-500/10 text-red-600",
    general: "bg-slate-100 dark:bg-slate-500/10 text-slate-600",
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#0F172A] font-sans transition-colors">
      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 px-6 py-3">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center font-black text-xs text-white">L</div>
            <span className="text-lg font-black tracking-tighter">LML<span className="text-violet-500">.</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/learn-more" className="text-xs font-bold text-slate-500 hover:text-violet-600 transition-colors uppercase tracking-widest">About</Link>
            <ThemeSwitcher />
            <Link href="/auth/login" className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors">
              Login
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12 space-y-3">
          <span className="text-[10px] font-black text-violet-600 uppercase tracking-[0.3em]">From the Lab</span>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
            LML Blog
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto text-sm font-medium">
            Insights, tips, and stories from our tutors and educators to help you master language faster.
          </p>
        </div>

        {blogPosts.length === 0 ? (
          <div className="text-center py-24 space-y-3">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto" />
            <p className="text-slate-400 font-medium">No blog posts published yet. Check back soon!</p>
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-violet-600 font-bold hover:underline mt-2">
              <ArrowRight size={14} className="rotate-180" /> Back to Home
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogPosts.map((post: any) => (
              <Link key={post.id} href={`/blog/${post.id}`}
                className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col">
                {post.cover_image_url ? (
                  <div className="aspect-video overflow-hidden">
                    <img src={post.cover_image_url} alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-violet-100 to-violet-200 dark:from-violet-900/30 dark:to-violet-800/20 flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-violet-400" />
                  </div>
                )}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${categoryColors[post.category] ?? categoryColors.general}`}>
                      {post.category ?? "general"}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-white line-clamp-2 group-hover:text-violet-600 transition-colors text-sm mb-2">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-xs text-slate-500 line-clamp-3 flex-1 leading-relaxed">{post.excerpt}</p>
                  )}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <UserCircle size={11} />
                      <span className="font-semibold">{post.author?.full_name ?? "LML Team"}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Calendar size={10} />
                      {new Date(post.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 dark:border-white/5 py-8 mt-12">
        <div className="max-w-5xl mx-auto px-6 flex justify-between items-center opacity-60">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">© 2026 LML</p>
          <Link href="/" className="text-xs font-bold text-slate-400 hover:text-violet-600 transition-colors">← Back to Home</Link>
        </div>
      </footer>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Calendar, UserCircle, Tag, ArrowLeft } from "lucide-react";

export default async function PublicBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("blog_posts")
    .select("*, author:profiles!blog_posts_author_id_fkey(full_name, role)")
    .eq("id", id)
    .eq("status", "published")
    .single() as any;

  if (!post) return notFound();

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#0F172A] font-sans transition-colors">
      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 px-6 py-3">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <Link href="/blog" className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-violet-600 transition-colors">
            <ArrowLeft size={14} /> All Posts
          </Link>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <Link href="/auth/login" className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors">
              Login
            </Link>
          </div>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-12">
        {/* Cover */}
        {post.cover_image_url && (
          <div className="rounded-2xl overflow-hidden mb-8 aspect-video">
            <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {post.category && (
            <span className="text-[10px] font-black uppercase tracking-widest bg-violet-100 dark:bg-violet-500/10 text-violet-600 px-2.5 py-1 rounded-full">
              {post.category}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-4 leading-tight">
          {post.title}
        </h1>

        {/* Author + Date */}
        <div className="flex items-center gap-4 text-sm text-slate-500 mb-8 pb-6 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center text-violet-600 font-black text-xs">
              {post.author?.full_name?.[0]?.toUpperCase() ?? "L"}
            </div>
            <div>
              <p className="font-bold text-slate-700 dark:text-slate-300 text-xs">{post.author?.full_name ?? "LML Team"}</p>
              <p className="text-[10px] capitalize text-slate-400">{post.author?.role ?? "author"}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Calendar size={12} />
            {new Date(post.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>

        {/* Excerpt */}
        {post.excerpt && (
          <div className="border-l-4 border-violet-500 pl-5 mb-8 italic text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-medium">
            {post.excerpt}
          </div>
        )}

        {/* Content */}
        <div
          className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: post.content ?? "" }}
        />

        {/* Footer CTA */}
        <div className="mt-12 p-6 bg-violet-50 dark:bg-violet-500/10 rounded-2xl border border-violet-200 dark:border-violet-500/20 text-center space-y-3">
          <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">Want to learn more?</p>
          <p className="text-xs text-slate-500">Join the Language Mastery Lab and start your journey today.</p>
          <Link href="/auth/sign-up" className="inline-block bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition-colors">
            Join the Lab →
          </Link>
        </div>

        <Link href="/blog" className="inline-flex items-center gap-2 mt-8 text-sm text-slate-500 hover:text-violet-600 font-semibold transition-colors">
          <ArrowLeft size={14} /> Back to Blog
        </Link>
      </article>
    </div>
  );
}

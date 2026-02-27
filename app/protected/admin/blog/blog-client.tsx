"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, Eye, Send, BookOpen, Clock, CheckCircle, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

type BlogPost = {
  id: string;
  title: string;
  excerpt?: string;
  status: "draft" | "published";
  created_at: string;
  author_id: string;
  category?: string;
  cover_image_url?: string;
  profiles?: { full_name: string };
};

export function BlogManagementClient({
  initialPosts,
  authorId,
  authorName,
}: {
  initialPosts: BlogPost[];
  authorId: string;
  authorName: string;
}) {
  const supabase = createClient();
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [form, setForm] = useState({ title: "", excerpt: "", content: "", category: "general", cover_image_url: "", status: "draft" as "draft" | "published" });
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    setEditingPost(null);
    setForm({ title: "", excerpt: "", content: "", category: "general", cover_image_url: "", status: "draft" });
    setShowEditor(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditingPost(post);
    setForm({ title: post.title, excerpt: post.excerpt || "", content: "", category: post.category || "general", cover_image_url: post.cover_image_url || "", status: post.status });
    setShowEditor(true);
  };

  const handleSave = async (publishNow = false) => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    const payload = {
      ...form,
      status: publishNow ? "published" : form.status,
      author_id: authorId,
    };

    if (editingPost) {
      const { data, error } = await supabase.from("blog_posts").update(payload).eq("id", editingPost.id).select("*, profiles(full_name)").single();
      if (error) { toast.error("Failed to update post"); setSaving(false); return; }
      setPosts((prev) => prev.map((p) => p.id === editingPost.id ? data : p));
      toast.success("Post updated!");
    } else {
      const { data, error } = await supabase.from("blog_posts").insert([payload]).select("*, profiles(full_name)").single();
      if (error) { toast.error("Failed to create post"); setSaving(false); return; }
      setPosts((prev) => [data, ...prev]);
      // If publishing, send notification to all students
      if (publishNow) {
        const { data: students } = await supabase.from("profiles").select("id").in("role", ["student", "tutor"]);
        if (students && students.length > 0) {
          const notifs = students.map((s: any) => ({
            user_id: s.id,
            title: "New Blog Post",
            message: `${authorName} published: "${form.title}"`,
            type: "blog",
            link: `/protected/student-board/blog/${data.id}`,
            is_read: false,
          }));
          await supabase.from("notifications").insert(notifs);
        }
      }
      toast.success(publishNow ? "Post published & notifications sent!" : "Draft saved!");
    }
    setSaving(false);
    setShowEditor(false);
  };

  const handlePublishToggle = async (post: BlogPost) => {
    const newStatus = post.status === "published" ? "draft" : "published";
    const { error } = await supabase.from("blog_posts").update({ status: newStatus }).eq("id", post.id);
    if (error) { toast.error("Failed to update status"); return; }
    setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, status: newStatus } : p));
    if (newStatus === "published") {
      // Notify all students
      const { data: students } = await supabase.from("profiles").select("id").in("role", ["student", "tutor"]);
      if (students && students.length > 0) {
        await supabase.from("notifications").insert(
          students.map((s: any) => ({
            user_id: s.id,
            title: "New Blog Post",
            message: `"${post.title}" is now live!`,
            type: "blog",
            link: `/protected/student-board/blog/${post.id}`,
            is_read: false,
          }))
        );
      }
      toast.success("Post published and students notified!");
    } else {
      toast.success("Post moved to drafts");
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("blog_posts").delete().eq("id", id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
    toast.success("Post deleted");
  };

  const categories = ["general", "language-tips", "grammar", "culture", "news", "announcements"];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-sm text-slate-500">
          <span><span className="font-bold text-slate-900 dark:text-white">{posts.filter(p => p.status === "published").length}</span> Published</span>
          <span><span className="font-bold text-amber-500">{posts.filter(p => p.status === "draft").length}</span> Drafts</span>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-indigo-500/25">
          <Plus size={14} /> New Post
        </button>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {posts.map((post) => (
          <div key={post.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
            {post.cover_image_url && (
              <div className="h-32 bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
            )}
            {!post.cover_image_url && (
              <div className="h-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center">
                <BookOpen size={32} className="text-indigo-300" />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${post.status === "published" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"}`}>
                  {post.status}
                </span>
                {post.category && <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full capitalize">{post.category}</span>}
              </div>
              <h4 className="font-bold text-slate-800 dark:text-white text-sm line-clamp-2 mb-1">{post.title}</h4>
              {post.excerpt && <p className="text-xs text-slate-400 line-clamp-2 mb-3">{post.excerpt}</p>}
              <p className="text-[10px] text-slate-400 mb-3">By {(post.profiles as any)?.full_name || authorName} · {new Date(post.created_at).toLocaleDateString()}</p>
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
                <button onClick={() => openEdit(post)} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors">
                  <Edit2 size={11} /> Edit
                </button>
                <button onClick={() => handlePublishToggle(post)} className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${post.status === "published" ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10" : "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"}`}>
                  {post.status === "published" ? <><Clock size={11} /> Unpublish</> : <><Send size={11} /> Publish</>}
                </button>
                <button onClick={() => handleDelete(post.id)} className="p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-16 text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5">
          <BookOpen size={40} className="mx-auto mb-3 text-slate-300" />
          <p className="font-medium">No posts yet</p>
          <p className="text-sm mt-1">Create your first blog post to get started</p>
          <button onClick={openNew} className="mt-4 bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">Write Post</button>
        </div>
      )}

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-white/10 my-8">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/5">
              <h3 className="font-bold text-slate-900 dark:text-white text-xl">{editingPost ? "Edit Post" : "New Blog Post"}</h3>
              <button onClick={() => setShowEditor(false)} className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Title</label>
                <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Post title..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none text-slate-700 dark:text-slate-200" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Excerpt</label>
                <input value={form.excerpt} onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))}
                  placeholder="Short description for preview..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none text-slate-700 dark:text-slate-200" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Category</label>
                  <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none text-slate-700 dark:text-slate-200">
                    {categories.map((c) => <option key={c} value={c} className="capitalize">{c.replace("-", " ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Cover Image URL</label>
                  <input value={form.cover_image_url} onChange={(e) => setForm((p) => ({ ...p, cover_image_url: e.target.value }))}
                    placeholder="https://..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none text-slate-700 dark:text-slate-200" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Content (Markdown / HTML)</label>
                <textarea value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                  rows={10} placeholder="Write your blog post content here..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none resize-none font-mono text-slate-700 dark:text-slate-200" />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-white/5">
              <button onClick={() => setShowEditor(false)} className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-600 dark:text-slate-400">Cancel</button>
              <button onClick={() => handleSave(false)} disabled={saving} className="flex-1 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 text-sm font-semibold transition-colors disabled:opacity-50">
                Save Draft
              </button>
              <button onClick={() => handleSave(true)} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-50">
                <CheckCircle size={14} /> Publish & Notify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

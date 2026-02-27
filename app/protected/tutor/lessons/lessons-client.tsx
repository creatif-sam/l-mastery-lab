"use client";

import { useState } from "react";
import { BookOpen, Plus, Play, FileText, Edit2, Trash2, X, Loader2, Search, Clock, Tag } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Category = { id: string; name_en: string; name_fr: string; color_code: string };
type Lesson = {
  id: string;
  title_en: string;
  title_fr: string;
  slug: string;
  order_index: number;
  content_type: "video" | "text";
  duration_minutes: number | null;
  description_en: string | null;
  description_fr: string | null;
  video_id: string | null;
  body_content_en: string | null;
  body_content_fr: string | null;
  created_at: string;
  created_by: string | null;
  category_id: string | null;
  lesson_categories: { name_en: string; name_fr: string; color_code: string } | null;
};

type LessonForm = {
  title_en: string; title_fr: string;
  slug: string;
  category_id: string;
  content_type: "video" | "text";
  video_id: string;
  description_en: string; description_fr: string;
  body_content_en: string; body_content_fr: string;
  duration_minutes: string;
  order_index: string;
};

const emptyForm: LessonForm = {
  title_en: "", title_fr: "", slug: "", category_id: "",
  content_type: "video", video_id: "",
  description_en: "", description_fr: "",
  body_content_en: "", body_content_fr: "",
  duration_minutes: "", order_index: "",
};

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function TutorLessonsClient({
  initialLessons,
  categories,
  currentUserId,
}: {
  initialLessons: Lesson[];
  categories: Category[];
  currentUserId: string;
}) {
  const supabase = createClient();
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [form, setForm] = useState<LessonForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatEn, setNewCatEn] = useState("");
  const [newCatFr, setNewCatFr] = useState("");
  const [newCatColor, setNewCatColor] = useState("#7C3AED");
  const [savingCat, setSavingCat] = useState(false);
  const [catList, setCatList] = useState<Category[]>(categories);

  const filtered = lessons.filter((l) => {
    const matchSearch = l.title_en?.toLowerCase().includes(search.toLowerCase()) ||
      l.title_fr?.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "all" || l.category_id === catFilter;
    return matchSearch && matchCat;
  });

  const openCreate = () => {
    setEditingLesson(null);
    setForm({ ...emptyForm, order_index: String(lessons.length + 1) });
    setShowModal(true);
  };

  const openEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setForm({
      title_en: lesson.title_en ?? "",
      title_fr: lesson.title_fr ?? "",
      slug: lesson.slug ?? "",
      category_id: lesson.category_id ?? "",
      content_type: lesson.content_type ?? "video",
      video_id: lesson.video_id ?? "",
      description_en: lesson.description_en ?? "",
      description_fr: lesson.description_fr ?? "",
      body_content_en: lesson.body_content_en ?? "",
      body_content_fr: lesson.body_content_fr ?? "",
      duration_minutes: lesson.duration_minutes?.toString() ?? "",
      order_index: lesson.order_index?.toString() ?? "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title_en.trim()) { toast.error("English title is required"); return; }
    if (!form.slug.trim()) { toast.error("Slug is required"); return; }
    if (form.content_type === "video" && !form.video_id.trim()) { toast.error("Video ID is required for video lessons"); return; }
    setSaving(true);

    const payload: any = {
      title_en: form.title_en.trim(),
      title_fr: form.title_fr.trim(),
      slug: form.slug.trim(),
      category_id: form.category_id || null,
      content_type: form.content_type,
      video_id: form.content_type === "video" ? form.video_id.trim() : null,
      description_en: form.description_en.trim() || null,
      description_fr: form.description_fr.trim() || null,
      body_content_en: form.content_type === "text" ? form.body_content_en.trim() : null,
      body_content_fr: form.content_type === "text" ? form.body_content_fr.trim() : null,
      duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
      order_index: form.order_index ? parseInt(form.order_index) : lessons.length + 1,
      created_by: currentUserId,
    };

    if (editingLesson) {
      const { data, error } = await supabase.from("lessons").update(payload).eq("id", editingLesson.id)
        .select("id, title_en, title_fr, slug, order_index, content_type, duration_minutes, description_en, description_fr, video_id, body_content_en, body_content_fr, created_at, created_by, category_id, lesson_categories(name_en, name_fr, color_code)")
        .single();
      if (error) { toast.error(error.message); setSaving(false); return; }
      setLessons((prev) => prev.map((l) => l.id === editingLesson.id ? (data as any) : l));
      toast.success("Lesson updated!");
    } else {
      const { data, error } = await supabase.from("lessons").insert(payload)
        .select("id, title_en, title_fr, slug, order_index, content_type, duration_minutes, description_en, description_fr, video_id, body_content_en, body_content_fr, created_at, created_by, category_id, lesson_categories(name_en, name_fr, color_code)")
        .single();
      if (error) { toast.error(error.message); setSaving(false); return; }
      setLessons((prev) => [...prev, data as any]);
      toast.success("Lesson created! 🎉");
    }
    setSaving(false);
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this lesson? This cannot be undone.")) return;
    setDeletingId(id);
    const { error } = await supabase.from("lessons").delete().eq("id", id);
    if (error) { toast.error(error.message); setDeletingId(null); return; }
    setLessons((prev) => prev.filter((l) => l.id !== id));
    toast.success("Lesson deleted");
    setDeletingId(null);
  };

  const handleCreateCategory = async () => {
    if (!newCatEn.trim()) { toast.error("English name required"); return; }
    setSavingCat(true);
    const { data, error } = await supabase.from("lesson_categories")
      .insert({ name_en: newCatEn.trim(), name_fr: newCatFr.trim() || newCatEn.trim(), color_code: newCatColor })
      .select().single();
    if (error) { toast.error(error.message); setSavingCat(false); return; }
    setCatList((prev) => [...prev, data as Category]);
    setForm((f) => ({ ...f, category_id: (data as Category).id }));
    setNewCatEn(""); setNewCatFr(""); setNewCatColor("#7C3AED");
    setShowNewCat(false);
    setSavingCat(false);
    toast.success("Category created!");
  };

  const myLessons = lessons.filter((l) => l.created_by === currentUserId);

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "All Lessons", value: lessons.length, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "My Lessons", value: myLessons.length, color: "text-violet-500", bg: "bg-violet-500/10" },
          { label: "Video", value: lessons.filter((l) => l.content_type === "video").length, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Text", value: lessons.filter((l) => l.content_type === "text").length, color: "text-amber-500", bg: "bg-amber-500/10" },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center`}>
              <BookOpen className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-xl font-black text-slate-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 flex-1">
          <Search size={14} className="text-slate-400 flex-shrink-0" />
          <input type="text" placeholder="Search lessons..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm text-slate-700 dark:text-slate-300 flex-1 outline-none placeholder:text-slate-400" />
        </div>
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2">
          <Tag size={14} className="text-slate-400 flex-shrink-0" />
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
            className="bg-transparent text-sm text-slate-700 dark:text-slate-300 outline-none">
            <option value="all">All Categories</option>
            {catList.map((c) => <option key={c.id} value={c.id}>{c.name_en}</option>)}
          </select>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
          <Plus size={15} /> New Lesson
        </button>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 p-16 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No lessons found.</p>
          <button onClick={openCreate} className="mt-4 text-sm text-emerald-600 font-semibold hover:underline">Create the first one →</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((lesson) => {
            const isMine = lesson.created_by === currentUserId;
            const cat = lesson.lesson_categories;
            return (
              <div key={lesson.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden group">
                <div className="h-1.5" style={{ background: cat?.color_code ?? "#7C3AED" }} />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 dark:text-white text-sm line-clamp-1">{lesson.title_en}</p>
                      {lesson.title_fr && <p className="text-xs text-slate-400 line-clamp-1 mt-0.5 italic">{lesson.title_fr}</p>}
                    </div>
                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0",
                      lesson.content_type === "video" ? "bg-blue-50 dark:bg-blue-500/10 text-blue-500" : "bg-amber-50 dark:bg-amber-500/10 text-amber-500")}>
                      {lesson.content_type === "video" ? <Play size={13} /> : <FileText size={13} />}
                    </div>
                  </div>
                  {cat && (
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-2"
                      style={{ background: cat.color_code + "20", color: cat.color_code }}>
                      {cat.name_en}
                    </span>
                  )}
                  {lesson.description_en && <p className="text-xs text-slate-500 line-clamp-2 mb-3">{lesson.description_en}</p>}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-3 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1"><Clock size={10} />{lesson.duration_minutes ?? "—"} min</span>
                      <span>#{lesson.order_index}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Link href={`/protected/student-board/lessons/${lesson.id}`}
                        className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                        title="Preview">
                        <Play size={12} />
                      </Link>
                      {isMine && (
                        <>
                          <button onClick={() => openEdit(lesson)}
                            className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                            title="Edit">
                            <Edit2 size={12} />
                          </button>
                          <button onClick={() => handleDelete(lesson.id)} disabled={deletingId === lesson.id}
                            className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
                            title="Delete">
                            {deletingId === lesson.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-white/10 my-4">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/10">
              <h2 className="font-bold text-slate-900 dark:text-white text-lg">
                {editingLesson ? "Edit Lesson" : "Create New Lesson"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X size={16} className="text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Titles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Title (English) *</label>
                  <input type="text" value={form.title_en}
                    onChange={(e) => setForm((f) => ({ ...f, title_en: e.target.value, slug: slugify(e.target.value) }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none text-slate-700 dark:text-slate-200"
                    placeholder="e.g. Introduction to French" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Title (French)</label>
                  <input type="text" value={form.title_fr}
                    onChange={(e) => setForm((f) => ({ ...f, title_fr: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none text-slate-700 dark:text-slate-200"
                    placeholder="e.g. Introduction au Français" />
                </div>
              </div>

              {/* Slug */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Slug *</label>
                <input type="text" value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none text-slate-700 dark:text-slate-200 font-mono"
                  placeholder="intro-to-french" />
              </div>

              {/* Category + Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</label>
                    <button onClick={() => setShowNewCat(!showNewCat)} className="text-[10px] text-emerald-600 font-semibold hover:underline">+ new</button>
                  </div>
                  <select value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none text-slate-700 dark:text-slate-200">
                    <option value="">— No category —</option>
                    {catList.map((c) => <option key={c.id} value={c.id}>{c.name_en}</option>)}
                  </select>
                  {showNewCat && (
                    <div className="mt-2 p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl space-y-2 border border-emerald-200 dark:border-emerald-500/20">
                      <input type="text" value={newCatEn} onChange={(e) => setNewCatEn(e.target.value)} placeholder="Category name (EN)" className="w-full bg-white dark:bg-slate-800 rounded-lg px-3 py-1.5 text-xs outline-none border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200" />
                      <input type="text" value={newCatFr} onChange={(e) => setNewCatFr(e.target.value)} placeholder="Nom (FR)" className="w-full bg-white dark:bg-slate-800 rounded-lg px-3 py-1.5 text-xs outline-none border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200" />
                      <div className="flex items-center gap-2">
                        <input type="color" value={newCatColor} onChange={(e) => setNewCatColor(e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer border-0" />
                        <button onClick={handleCreateCategory} disabled={savingCat} className="flex-1 bg-emerald-600 text-white text-xs font-semibold py-1.5 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">
                          {savingCat ? "Saving…" : "Create Category"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Order #</label>
                    <input type="number" value={form.order_index} onChange={(e) => setForm((f) => ({ ...f, order_index: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none text-slate-700 dark:text-slate-200" min="1" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Duration (min)</label>
                    <input type="number" value={form.duration_minutes} onChange={(e) => setForm((f) => ({ ...f, duration_minutes: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none text-slate-700 dark:text-slate-200" min="1" />
                  </div>
                </div>
              </div>

              {/* Content type */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Content Type</label>
                <div className="flex gap-2">
                  {(["video", "text"] as const).map((t) => (
                    <button key={t} onClick={() => setForm((f) => ({ ...f, content_type: t }))}
                      className={cn("flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors",
                        form.content_type === t
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-emerald-400")}>
                      {t === "video" ? "🎬 Video" : "📄 Text"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Video ID */}
              {form.content_type === "video" && (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">YouTube Video ID *</label>
                  <input type="text" value={form.video_id} onChange={(e) => setForm((f) => ({ ...f, video_id: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none text-slate-700 dark:text-slate-200 font-mono"
                    placeholder="e.g. dQw4w9WgXcQ" />
                  <p className="text-[10px] text-slate-400 mt-1">From youtube.com/watch?v=<strong>THIS_PART</strong></p>
                </div>
              )}

              {/* Descriptions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Description (EN)</label>
                  <textarea value={form.description_en} onChange={(e) => setForm((f) => ({ ...f, description_en: e.target.value }))} rows={3}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none resize-none text-slate-700 dark:text-slate-200"
                    placeholder="Brief description…" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Description (FR)</label>
                  <textarea value={form.description_fr} onChange={(e) => setForm((f) => ({ ...f, description_fr: e.target.value }))} rows={3}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none resize-none text-slate-700 dark:text-slate-200"
                    placeholder="Brève description…" />
                </div>
              </div>

              {/* Body content for text lessons */}
              {form.content_type === "text" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Body Content (EN)</label>
                    <textarea value={form.body_content_en} onChange={(e) => setForm((f) => ({ ...f, body_content_en: e.target.value }))} rows={6}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none resize-none text-slate-700 dark:text-slate-200"
                      placeholder="Full lesson content in English…" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Body Content (FR)</label>
                    <textarea value={form.body_content_fr} onChange={(e) => setForm((f) => ({ ...f, body_content_fr: e.target.value }))} rows={6}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none resize-none text-slate-700 dark:text-slate-200"
                      placeholder="Contenu complet en français…" />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 border-t border-slate-100 dark:border-white/10">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : editingLesson ? "Save Changes" : "Create Lesson"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

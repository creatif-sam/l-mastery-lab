"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Plus,
  Search,
  HelpCircle,
  Edit,
  Trash2,
  X,
  ChevronDown,
  CheckCircle2,
  Circle,
  BookOpen,
  Users,
  BarChart3,
  Globe,
  AlertTriangle,
  Loader2,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────── */
interface QuestionOption {
  id?: string;
  option_text: string;
  is_correct: boolean;
}

interface Question {
  id?: string;
  question_text: string;
  explanation: string;
  options: QuestionOption[];
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  target_language: string | null;
  difficulty_level: string | null;
  created_at: string;
  created_by: string | null;
  questions?: { id: string }[];
}

interface Props {
  initialQuizzes: any[];
  currentUserId: string;
}

const DIFFICULTIES = ["beginner", "intermediate", "advanced"];
const LANGUAGES = ["english", "french", "both"];

const difficultyColor: Record<string, string> = {
  beginner: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  intermediate: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  advanced: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const langLabel: Record<string, string> = {
  english: "English",
  french: "French",
  both: "Both",
};

const emptyQuestion = (): Question => ({
  question_text: "",
  explanation: "",
  options: [
    { option_text: "", is_correct: true },
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false },
  ],
});

/* ─── Component ──────────────────────────────────────────────── */
export function TutorQuizClient({ initialQuizzes, currentUserId }: Props) {
  const supabase = createClient();

  const [quizzes, setQuizzes] = useState<Quiz[]>(initialQuizzes as Quiz[]);
  const [search, setSearch] = useState("");
  const [diffFilter, setDiffFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  /* form state */
  const [form, setForm] = useState({
    title: "",
    description: "",
    target_language: "english",
    difficulty_level: "beginner",
  });
  const [questions, setQuestions] = useState<Question[]>([emptyQuestion()]);

  /* ── derived ──────────────────────────────────── */
  const myQuizzes = quizzes.filter((q) => q.created_by === currentUserId);
  const totalQuestions = quizzes.reduce((acc, q) => acc + (q.questions?.length ?? 0), 0);

  const filtered = quizzes.filter((q) => {
    const matchSearch =
      !search ||
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      (q.description ?? "").toLowerCase().includes(search.toLowerCase());
    const matchDiff = diffFilter === "all" || q.difficulty_level === diffFilter;
    return matchSearch && matchDiff;
  });

  /* ── open create modal ─────────────────────────── */
  const openCreate = () => {
    setEditingQuiz(null);
    setForm({ title: "", description: "", target_language: "english", difficulty_level: "beginner" });
    setQuestions([emptyQuestion()]);
    setModalOpen(true);
  };

  /* ── open edit modal ───────────────────────────── */
  const openEdit = async (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setForm({
      title: quiz.title,
      description: quiz.description ?? "",
      target_language: quiz.target_language ?? "english",
      difficulty_level: quiz.difficulty_level ?? "beginner",
    });
    setLoadingQuestions(true);
    setModalOpen(true);

    const { data: qs } = await supabase
      .from("questions")
      .select("id, question_text, explanation, question_options(id, option_text, is_correct)")
      .eq("quiz_id", quiz.id)
      .order("id");

    if (qs && qs.length > 0) {
      setQuestions(
        qs.map((q: any) => ({
          id: q.id,
          question_text: q.question_text,
          explanation: q.explanation ?? "",
          options: (q.question_options ?? []).map((o: any) => ({
            id: o.id,
            option_text: o.option_text,
            is_correct: o.is_correct,
          })),
        }))
      );
    } else {
      setQuestions([emptyQuestion()]);
    }
    setLoadingQuestions(false);
  };

  /* ── question helpers ───────────────────────────── */
  const addQuestion = () =>
    setQuestions((prev) => [...prev, emptyQuestion()]);

  const removeQuestion = (qi: number) =>
    setQuestions((prev) => prev.filter((_, i) => i !== qi));

  const updateQuestion = (qi: number, field: keyof Question, value: string) =>
    setQuestions((prev) =>
      prev.map((q, i) => (i === qi ? { ...q, [field]: value } : q))
    );

  const updateOption = (qi: number, oi: number, field: keyof QuestionOption, value: any) =>
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qi) return q;
        const opts = q.options.map((o, j) => {
          if (field === "is_correct") {
            return { ...o, is_correct: j === oi };
          }
          return j === oi ? { ...o, [field]: value } : o;
        });
        return { ...q, options: opts };
      })
    );

  const addOption = (qi: number) =>
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qi && q.options.length < 6
          ? { ...q, options: [...q.options, { option_text: "", is_correct: false }] }
          : q
      )
    );

  const removeOption = (qi: number, oi: number) =>
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qi || q.options.length <= 2) return q;
        const opts = q.options.filter((_, j) => j !== oi);
        if (!opts.some((o) => o.is_correct)) opts[0].is_correct = true;
        return { ...q, options: opts };
      })
    );

  /* ── save ────────────────────────────────────────── */
  const handleSave = async () => {
    if (!form.title.trim()) return toast.error("Quiz title is required.");
    for (const [qi, q] of questions.entries()) {
      if (!q.question_text.trim()) return toast.error(`Question ${qi + 1} text is required.`);
      if (!q.options.some((o) => o.is_correct)) return toast.error(`Question ${qi + 1} needs a correct answer.`);
      for (const [oi, o] of q.options.entries()) {
        if (!o.option_text.trim()) return toast.error(`Q${qi + 1} option ${oi + 1} text is required.`);
      }
    }

    setSaving(true);
    try {
      let quizId = editingQuiz?.id ?? null;

      if (editingQuiz) {
        const { error } = await supabase
          .from("quizzes")
          .update({ ...form })
          .eq("id", editingQuiz.id);
        if (error) throw error;

        /* delete old questions (cascades to options) */
        await supabase.from("questions").delete().eq("quiz_id", editingQuiz.id);
      } else {
        const { data, error } = await supabase
          .from("quizzes")
          .insert({ ...form, created_by: currentUserId })
          .select("id")
          .single();
        if (error) throw error;
        quizId = data.id;
      }

      /* insert questions + options */
      for (const q of questions) {
        const { data: qRow, error: qErr } = await supabase
          .from("questions")
          .insert({ quiz_id: quizId, question_text: q.question_text, explanation: q.explanation || null })
          .select("id")
          .single();
        if (qErr) throw qErr;

        const opts = q.options.map((o) => ({
          question_id: qRow.id,
          option_text: o.option_text,
          is_correct: o.is_correct,
        }));
        const { error: oErr } = await supabase.from("question_options").insert(opts);
        if (oErr) throw oErr;
      }

      /* refresh list */
      const { data: fresh } = await supabase
        .from("quizzes")
        .select("id, title, description, target_language, difficulty_level, created_at, created_by, questions(id)")
        .order("created_at", { ascending: false });
      setQuizzes((fresh ?? []) as Quiz[]);
      toast.success(editingQuiz ? "Quiz updated!" : "Quiz created!");
      setModalOpen(false);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save quiz.");
    } finally {
      setSaving(false);
    }
  };

  /* ── delete ──────────────────────────────────────── */
  const handleDelete = async (quiz: Quiz) => {
    if (!confirm(`Delete "${quiz.title}"? This cannot be undone.`)) return;
    setDeleting(quiz.id);
    try {
      const { error } = await supabase.from("quizzes").delete().eq("id", quiz.id);
      if (error) throw error;
      setQuizzes((prev) => prev.filter((q) => q.id !== quiz.id));
      toast.success("Quiz deleted.");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to delete.");
    } finally {
      setDeleting(null);
    }
  };

  /* ────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Quizzes", value: quizzes.length, icon: HelpCircle, color: "text-emerald-500" },
          { label: "My Quizzes", value: myQuizzes.length, icon: BookOpen, color: "text-blue-500" },
          { label: "Total Questions", value: totalQuestions, icon: BarChart3, color: "text-purple-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-white/5 p-4 flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-slate-100 dark:bg-slate-700/50 ${s.color}`}>
              <s.icon size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          </div>
        ))}
        <div
          onClick={openCreate}
          className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:opacity-90 transition-opacity"
        >
          <div className="p-3 rounded-xl bg-white/20 text-white">
            <Plus size={20} />
          </div>
          <div>
            <div className="text-sm font-bold text-white">New Quiz</div>
            <div className="text-xs text-white/75">Create a quiz</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quizzes…"
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>
        <div className="relative">
          <select
            value={diffFilter}
            onChange={(e) => setDiffFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          >
            <option value="all">All Levels</option>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} /> New Quiz
        </button>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <HelpCircle size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No quizzes found</p>
          <p className="text-sm mt-1">Create your first quiz to get started.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((quiz) => {
            const isOwner = quiz.created_by === currentUserId;
            const qCount = quiz.questions?.length ?? 0;
            return (
              <div
                key={quiz.id}
                className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* header stripe */}
                <div className={`h-1.5 w-full ${quiz.difficulty_level === "beginner" ? "bg-emerald-500" : quiz.difficulty_level === "intermediate" ? "bg-yellow-400" : "bg-red-500"}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight line-clamp-2">{quiz.title}</h3>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${difficultyColor[quiz.difficulty_level ?? "beginner"] ?? ""}`}>
                      {quiz.difficulty_level ?? "—"}
                    </span>
                  </div>
                  {quiz.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{quiz.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
                    <span className="flex items-center gap-1">
                      <HelpCircle size={12} /> {qCount} question{qCount !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <Globe size={12} /> {langLabel[quiz.target_language ?? ""] ?? quiz.target_language ?? "—"}
                    </span>
                  </div>
                </div>
                <div className="border-t border-slate-100 dark:border-white/5 px-5 py-3 flex items-center justify-between">
                  <span className={`text-xs ${isOwner ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-slate-400"}`}>
                    {isOwner ? "Your quiz" : "Shared"}
                  </span>
                  {isOwner && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(quiz)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
                        title="Edit"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(quiz)}
                        disabled={deleting === quiz.id}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        {deleting === quiz.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl my-8 shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/10">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingQuiz ? "Edit Quiz" : "New Quiz"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Quiz metadata */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Quiz Details</h3>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Title <span className="text-red-500">*</span></label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    placeholder="e.g. French Verb Conjugation"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none"
                    placeholder="Brief description…"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Target Language</label>
                    <select
                      value={form.target_language}
                      onChange={(e) => setForm((f) => ({ ...f, target_language: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    >
                      {LANGUAGES.map((l) => <option key={l} value={l}>{langLabel[l]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Difficulty</label>
                    <select
                      value={form.difficulty_level}
                      onChange={(e) => setForm((f) => ({ ...f, difficulty_level: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    >
                      {DIFFICULTIES.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Questions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Questions ({questions.length})
                  </h3>
                  <button
                    onClick={addQuestion}
                    className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                  >
                    <Plus size={13} /> Add Question
                  </button>
                </div>

                {loadingQuestions ? (
                  <div className="flex items-center justify-center py-10 text-slate-400">
                    <Loader2 size={22} className="animate-spin mr-2" /> Loading questions…
                  </div>
                ) : (
                  <div className="space-y-5">
                    {questions.map((q, qi) => (
                      <div key={qi} className="rounded-xl border border-slate-200 dark:border-white/10 p-4 space-y-3 bg-slate-50 dark:bg-slate-800/50">
                        {/* Question header */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Question {qi + 1}
                          </span>
                          {questions.length > 1 && (
                            <button
                              onClick={() => removeQuestion(qi)}
                              className="text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                        {/* Question text */}
                        <input
                          value={q.question_text}
                          onChange={(e) => updateQuestion(qi, "question_text", e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                          placeholder="Question text…"
                        />
                        {/* Explanation */}
                        <input
                          value={q.explanation}
                          onChange={(e) => updateQuestion(qi, "explanation", e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                          placeholder="Explanation (shown after attempt)…"
                        />
                        {/* Options */}
                        <div className="space-y-2">
                          <span className="text-xs text-slate-500 dark:text-slate-400">Options — click the circle to mark correct answer</span>
                          {q.options.map((opt, oi) => (
                            <div key={oi} className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateOption(qi, oi, "is_correct", true)}
                                className={`flex-shrink-0 ${opt.is_correct ? "text-emerald-500" : "text-slate-300 dark:text-slate-600 hover:text-slate-400"} transition-colors`}
                              >
                                {opt.is_correct ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                              </button>
                              <input
                                value={opt.option_text}
                                onChange={(e) => updateOption(qi, oi, "option_text", e.target.value)}
                                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                                placeholder={`Option ${oi + 1}`}
                              />
                              {q.options.length > 2 && (
                                <button
                                  onClick={() => removeOption(qi, oi)}
                                  className="text-slate-400 hover:text-red-500 transition-colors"
                                >
                                  <X size={14} />
                                </button>
                              )}
                            </div>
                          ))}
                          {q.options.length < 6 && (
                            <button
                              onClick={() => addOption(qi)}
                              className="text-xs text-slate-400 hover:text-emerald-500 flex items-center gap-1 mt-1 transition-colors"
                            >
                              <Plus size={12} /> Add option
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-white/10">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
              >
                {saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : editingQuiz ? "Save Changes" : "Create Quiz"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Swords, Plus, Play, Copy, Users, Trophy, Timer, CheckCircle2,
  XCircle, ArrowLeft, BarChart3, RefreshCw, Loader2, Search,
  BookOpen, Zap, Medal, ChevronDown, Trash2, AlertTriangle,
  Globe, Star, TrendingUp, Clock, Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

// ─ Types ─────────────────────────────────────────────────────
type HostPhase =
  | "list"
  | "setup_quiz"
  | "setup_config"
  | "lobby"
  | "question"
  | "reveal"
  | "finished";

type QuestionType = "multiple_choice" | "true_false";

interface QuizOption {
  id?: string;
  option_text: string;
  is_correct: boolean;
}

interface QuizQuestion {
  id?: string;
  question_text: string;
  explanation: string;
  question_type: QuestionType;
  time_limit: number; // 0 = use session global time
  options: QuizOption[];
}

interface Player {
  id: string;
  name: string;
  avatar?: string | null;
  score: number;
}

interface Session {
  id: string;
  join_code: string;
  status: string;
  time_per_question: number;
  created_at: string;
  quiz: { id: string; title: string };
  participants_count: number;
}

export interface CoopetitionHostProps {
  currentUser: { id: string; full_name: string; role: string };
  quizzes: Array<{ id: string; title: string; questionCount: number; difficulty_level?: string; target_language?: string }>;
}

// ─ Constants ─────────────────────────────────────────────────
const REV_SECS = 5;
const TIME_OPTIONS = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70];

const DIFFICULTIES = ["beginner", "intermediate", "advanced"];
const LANGUAGES = ["english", "french", "both"];

const diffColor: Record<string, string> = {
  beginner: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  intermediate: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  advanced: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const OPT_STYLES = [
  { bg: "bg-[#E21B3C]", shape: "▲", label: "A" },
  { bg: "bg-[#1368CE]", shape: "◆", label: "B" },
  { bg: "bg-[#D89E00]", shape: "●", label: "C" },
  { bg: "bg-[#26890C]", shape: "■", label: "D" },
];

const emptyMC = (): QuizQuestion => ({
  question_text: "",
  explanation: "",
  question_type: "multiple_choice",
  time_limit: 0,
  options: [
    { option_text: "", is_correct: true },
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false },
  ],
});

const emptyTF = (): QuizQuestion => ({
  question_text: "",
  explanation: "",
  question_type: "true_false",
  time_limit: 0,
  options: [
    { option_text: "True", is_correct: true },
    { option_text: "False", is_correct: false },
  ],
});

const Q_TIME_OPTIONS = [0, 10, 15, 20, 30, 45, 60];

// ─ Helper: Medal colors ──────────────────────────────────────
function medalColor(rank: number) {
  if (rank === 1) return "text-yellow-400";
  if (rank === 2) return "text-slate-400";
  if (rank === 3) return "text-amber-600";
  return "text-slate-500";
}

// ─ Component ─────────────────────────────────────────────────
export function CoopetitionHostClient({ currentUser, quizzes: initialQuizzes }: CoopetitionHostProps) {
  const supabase = createClient();

  // ── Phase & navigation ─────────────────────────────────────
  const [phase, setPhase] = useState<HostPhase>("list");

  // ── Sessions list ──────────────────────────────────────────
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [reportSession, setReportSession] = useState<any | null>(null);
  const [reportData, setReportData] = useState<any | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // ── Quiz setup ─────────────────────────────────────────────
  const [quizzes] = useState(initialQuizzes);
  const [quizSearch, setQuizSearch] = useState("");
  const [quizTab, setQuizTab] = useState<"existing" | "new">("existing");
  const [selectedQuizId, setSelectedQuizId] = useState("");

  // New quiz form
  const [newQuizForm, setNewQuizForm] = useState({
    title: "", description: "", target_language: "english", difficulty_level: "beginner",
  });
  const [newQuestions, setNewQuestions] = useState<QuizQuestion[]>([emptyMC()]);
  const [savingQuiz, setSavingQuiz] = useState(false);

  // ── Game config ────────────────────────────────────────────
  const [timeSecs, setTimeSecs] = useState(15);

  // ── Lobby & game ───────────────────────────────────────────
  const chanRef        = useRef<any>(null);
  const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const revTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHostRef      = useRef(true);
  const qIdxRef        = useRef(0);
  const questionsRef   = useRef<any[]>([]);
  const playersRef     = useRef<Player[]>([]);
  const sessionIdRef   = useRef("");
  const answersRef     = useRef<Record<string, string>>({});
  const revFiredRef    = useRef(false);
  const timeSecsRef    = useRef(15);

  const [joinCode, setJoinCode]         = useState("");
  const [players, setPlayers]           = useState<Player[]>([]);
  const [questions, setQuestions]       = useState<any[]>([]);
  const [qIdx, setQIdx]                 = useState(0);
  const [timeLeft, setTimeLeft]         = useState(15);
  const [correctId, setCorrectId]       = useState<string | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [creatingSession, setCreatingSession] = useState(false);
  const [startingGame, setStartingGame] = useState(false);

  // Keep refs in sync
  useEffect(() => { qIdxRef.current = qIdx; }, [qIdx]);
  useEffect(() => { questionsRef.current = questions; }, [questions]);
  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { timeSecsRef.current = timeSecs; }, [timeSecs]);

  // ── Load sessions on mount ─────────────────────────────────
  useEffect(() => {
    loadSessions();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cleanup on unmount ─────────────────────────────────────
  useEffect(() => () => {
    clearAllTimers();
    if (chanRef.current) supabase.removeChannel(chanRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const clearAllTimers = () => {
    if (timerRef.current)    { clearInterval(timerRef.current); timerRef.current = null; }
    if (revTimerRef.current) { clearTimeout(revTimerRef.current); revTimerRef.current = null; }
  };

  // ── Load sessions list ─────────────────────────────────────
  const loadSessions = async () => {
    setLoadingSessions(true);
    const { data } = await supabase
      .from("coopetition_sessions")
      .select("id, join_code, status, time_per_question, created_at, quiz:quizzes(id, title)")
      .eq("host_id", currentUser.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) {
      // Get participant counts
      const ids = data.map((s: any) => s.id);
      const { data: counts } = await supabase
        .from("coopetition_participants")
        .select("session_id")
        .in("session_id", ids);

      const countMap: Record<string, number> = {};
      (counts ?? []).forEach((c: any) => {
        countMap[c.session_id] = (countMap[c.session_id] ?? 0) + 1;
      });

      setSessions(data.map((s: any) => ({
        ...s,
        quiz: Array.isArray(s.quiz) ? s.quiz[0] : s.quiz,
        participants_count: countMap[s.id] ?? 0,
      })));
    }
    setLoadingSessions(false);
  };

  // ── Load report for a given session ───────────────────────
  const loadReport = async (session: Session) => {
    setLoadingReport(true);
    setReportSession(session);

    // Participants
    const { data: participants } = await supabase
      .from("coopetition_participants")
      .select("user_id, display_name, avatar_url, score")
      .eq("session_id", session.id)
      .order("score", { ascending: false });

    // Answers per question
    const { data: answers } = await supabase
      .from("coopetition_answers")
      .select("question_id, user_id, is_correct, time_taken, option_id")
      .eq("session_id", session.id);

    // Questions with options
    const { data: qs } = await supabase
      .from("questions")
      .select("id, question_text, question_type, options:question_options(id, option_text, is_correct)")
      .eq("quiz_id", session.quiz?.id ?? "")
      .order("created_at", { ascending: true });

    setReportData({ participants: participants ?? [], answers: answers ?? [], questions: qs ?? [] });
    setLoadingReport(false);
  };

  // ── Realtime subscribe ─────────────────────────────────────
  const subscribe = useCallback((sid: string) => {
    if (chanRef.current) { supabase.removeChannel(chanRef.current); chanRef.current = null; }
    sessionIdRef.current = sid;

    const chan = supabase
      .channel(`coopetition:${sid}`)
      .on("broadcast", { event: "player_joined" }, ({ payload }) => {
        setPlayers(prev => {
          if (prev.some(p => p.id === payload.id)) return prev;
          const np: Player = { id: payload.id, name: payload.name, avatar: payload.avatar, score: 0 };
          playersRef.current = [...prev, np];
          return [...prev, np];
        });
      })
      .on("broadcast", { event: "player_answer" }, ({ payload }) => {
        answersRef.current[payload.userId] = payload.optionId;
        setAnsweredCount(prev => prev + 1);
      })
      .subscribe();

    chanRef.current = chan;
  }, [supabase]);

  // ── Reveal logic ───────────────────────────────────────────
  const doReveal = useCallback(async () => {
    if (revFiredRef.current) return;
    revFiredRef.current = true;
    clearAllTimers();

    const curQ  = questionsRef.current[qIdxRef.current];
    if (!curQ) return;
    const opts    = curQ.options ?? curQ.question_options ?? [];
    const correct = opts.find((o: any) => o.is_correct);
    if (!correct) return;

    const cid = correct.id as string;
    const recs = { ...answersRef.current };

    const updated = playersRef.current.map(p => ({
      ...p, score: p.score + (recs[p.id] === cid ? 100 : 0),
    }));
    playersRef.current = updated;
    setPlayers(updated);
    setCorrectId(cid);
    setAnsweredCount(0);
    setPhase("reveal");
    answersRef.current = {};

    chanRef.current?.send({
      type: "broadcast", event: "game_reveal",
      payload: { correctId: cid, players: updated },
    });

    // Save answers to DB for report
    const sessionId = sessionIdRef.current;
    for (const [uid, optId] of Object.entries(recs)) {
      await supabase.from("coopetition_answers").upsert({
        session_id: sessionId,
        question_id: curQ.id,
        user_id: uid,
        option_id: optId,
        is_correct: optId === cid,
      }, { onConflict: "session_id,question_id,user_id" });
    }

    revTimerRef.current = setTimeout(async () => {
      const nextIdx = qIdxRef.current + 1;
      const qs = questionsRef.current;
      if (nextIdx >= qs.length) {
        // End
        setPhase("finished");
        chanRef.current?.send({ type: "broadcast", event: "game_end", payload: { players: updated } });
        for (const p of updated) {
          await supabase.from("coopetition_participants")
            .update({ score: p.score })
            .eq("session_id", sessionId)
            .eq("user_id", p.id);
        }
        await supabase.from("coopetition_sessions").update({ status: "finished" }).eq("id", sessionId);
        // Reload sessions list
        loadSessions();
      } else {
        revFiredRef.current = false;
        setQIdx(nextIdx);
        setCorrectId(null);
        setPhase("question");
        chanRef.current?.send({ type: "broadcast", event: "game_question", payload: { index: nextIdx } });
      }
    }, REV_SECS * 1000);
  }, [supabase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Countdown ──────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "question") return;
    clearAllTimers();
    revFiredRef.current = false;
    const curQ = questionsRef.current[qIdxRef.current];
    const t0   = (curQ?.time_limit > 0 ? curQ.time_limit : timeSecsRef.current) || 15;
    setTimeLeft(t0);
    let t = t0;
    timerRef.current = setInterval(() => {
      t--;
      setTimeLeft(t);
      if (t <= 0) { clearAllTimers(); doReveal(); }
    }, 1000);
    return clearAllTimers;
  }, [phase, qIdx, doReveal]);

  // ── Create new quiz then session ───────────────────────────
  const handleSaveNewQuiz = async (): Promise<string | null> => {
    if (!newQuizForm.title.trim()) { toast.error("Quiz title required"); return null; }
    if (newQuestions.some(q => !q.question_text.trim())) { toast.error("All questions need text"); return null; }
    for (const q of newQuestions) {
      if (!q.options.some(o => o.is_correct)) { toast.error("Each question needs a correct answer"); return null; }
      if (q.question_type === "multiple_choice" && q.options.some(o => !o.option_text.trim())) {
        toast.error("Fill in all option texts"); return null; }
    }

    setSavingQuiz(true);
    const { data: quiz, error: qErr } = await supabase
      .from("quizzes")
      .insert({
        title: newQuizForm.title.trim(),
        description: newQuizForm.description.trim() || null,
        target_language: newQuizForm.target_language,
        difficulty_level: newQuizForm.difficulty_level,
        created_by: currentUser.id,
      })
      .select("id").single();

    if (qErr || !quiz) {
      toast.error(`Failed to create quiz: ${qErr?.message ?? "unknown error"}`);
      setSavingQuiz(false);
      return null;
    }

    for (const q of newQuestions) {
      const { data: question, error: rErr } = await supabase
        .from("questions")
        .insert({
          quiz_id: quiz.id,
          question_text: q.question_text,
          explanation: q.explanation || null,
          question_type: q.question_type,
          time_limit: q.time_limit,
        })
        .select("id").single();

      if (rErr || !question) { toast.error("Failed to save question"); setSavingQuiz(false); return null; }

      await supabase.from("question_options").insert(
        q.options.map(o => ({ question_id: question.id, option_text: o.option_text, is_correct: o.is_correct }))
      );
    }

    setSavingQuiz(false);
    toast.success("Quiz created!");
    return quiz.id;
  };

  // ── Create session ─────────────────────────────────────────
  const handleCreateSession = async () => {
    let qId = selectedQuizId;

    if (quizTab === "new") {
      const id = await handleSaveNewQuiz();
      if (!id) return;
      qId = id;
    }

    if (!qId) { toast.error("Select or create a quiz"); return; }

    setCreatingSession(true);
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data: session, error } = await supabase
      .from("coopetition_sessions")
      .insert({ quiz_id: qId, host_id: currentUser.id, join_code: code, status: "lobby", time_per_question: timeSecs })
      .select("id").single();

    if (error || !session) { toast.error("Could not create session"); setCreatingSession(false); return; }

    // Only add host as participant if they are a student (not tutor/admin — they host, not compete)
    if (currentUser.role === "student") {
      await supabase.from("coopetition_participants").insert({
        session_id: session.id,
        user_id: currentUser.id,
        display_name: currentUser.full_name,
      });
      const me: Player = { id: currentUser.id, name: currentUser.full_name, score: 0 };
      playersRef.current = [me];
      setPlayers([me]);
    } else {
      playersRef.current = [];
      setPlayers([]);
    }

    setJoinCode(code);
    subscribe(session.id);
    setPhase("lobby");
    setCreatingSession(false);
  };

  // ── Start game ─────────────────────────────────────────────
  const handleStartGame = async () => {
    setStartingGame(true);
    const session = await supabase
      .from("coopetition_sessions")
      .select("quiz_id, time_per_question")
      .eq("join_code", joinCode)
      .single();

    const qzId = session.data?.quiz_id ?? selectedQuizId;
    const tSecs = session.data?.time_per_question ?? timeSecs;
    timeSecsRef.current = tSecs;
    setTimeSecs(tSecs);

    const { data: qs, error } = await supabase
      .from("questions")
      .select("id, question_text, question_type, explanation, time_limit, options:question_options(id, option_text, is_correct)")
      .eq("quiz_id", qzId)
      .order("created_at", { ascending: true });

    if (error || !qs?.length) { toast.error("Could not load questions"); setStartingGame(false); return; }

    await supabase.from("coopetition_sessions").update({ status: "active" }).eq("join_code", joinCode);

    questionsRef.current = qs;
    qIdxRef.current = 0;
    revFiredRef.current = false;
    setQuestions(qs);
    setQIdx(0);
    setCorrectId(null);
    setAnsweredCount(0);

    chanRef.current?.send({
      type: "broadcast", event: "game_start",
      payload: { questions: qs, timeSecs: tSecs },
    });

    setPhase("question");
    setStartingGame(false);
  };

  // ── Manual reveal (host skips timer) ──────────────────────
  const handleSkip = () => { clearAllTimers(); doReveal(); };

  // ── Reset to list ──────────────────────────────────────────
  const handleReset = () => {
    clearAllTimers();
    if (chanRef.current) { supabase.removeChannel(chanRef.current); chanRef.current = null; }
    isHostRef.current = true;
    sessionIdRef.current = "";
    answersRef.current = {};
    revFiredRef.current = false;
    playersRef.current = [];
    questionsRef.current = [];
    qIdxRef.current = 0;
    setPhase("list");
    setJoinCode("");
    setPlayers([]);
    setQuestions([]);
    setQIdx(0);
    setCorrectId(null);
    setAnsweredCount(0);
    setSelectedQuizId("");
    setNewQuizForm({ title: "", description: "", target_language: "english", difficulty_level: "beginner" });
    setNewQuestions([emptyMC()]);
    setReportSession(null);
    setReportData(null);
    loadSessions();
  };

  // ─ Question helpers ───────────────────────────────────────
  const addQuestion = (type: QuestionType) => {
    setNewQuestions(prev => [...prev, type === "multiple_choice" ? emptyMC() : emptyTF()]);
  };

  const removeQuestion = (i: number) => {
    setNewQuestions(prev => prev.filter((_, idx) => idx !== i));
  };

  const updateQuestion = (i: number, field: string, val: string) => {
    setNewQuestions(prev => prev.map((q, idx) => idx === i ? { ...q, [field]: val } : q));
  };

  const changeQuestionType = (i: number, type: QuestionType) => {
    setNewQuestions(prev => prev.map((q, idx) =>
      idx === i ? (type === "multiple_choice"
        ? { ...emptyMC(), question_text: q.question_text, explanation: q.explanation, time_limit: q.time_limit }
        : { ...emptyTF(), question_text: q.question_text, explanation: q.explanation, time_limit: q.time_limit }
      ) : q
    ));
  };

  const updateQuestionTime = (i: number, val: number) => {
    setNewQuestions(prev => prev.map((q, idx) => idx === i ? { ...q, time_limit: val } : q));
  };

  const updateOption = (qi: number, oi: number, field: string, val: string | boolean) => {
    setNewQuestions(prev => prev.map((q, idx) => {
      if (idx !== qi) return q;
      const opts = q.options.map((o, oidx) =>
        field === "is_correct"
          ? { ...o, is_correct: oidx === oi }
          : oidx === oi ? { ...o, [field]: val } : o
      );
      return { ...q, options: opts };
    }));
  };

  // ════════════════════════════════════════════════════════════
  // RENDER — SESSIONS LIST
  // ════════════════════════════════════════════════════════════
  if (phase === "list" && !reportSession) {
    const finished = sessions.filter(s => s.status === "finished");
    const active   = sessions.filter(s => s.status !== "finished");
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
              <Swords size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white">Coopetition</h2>
              <p className="text-xs text-slate-400">Real-time quiz battles for your students</p>
            </div>
          </div>
          <button
            onClick={() => setPhase("setup_quiz")}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm rounded transition-colors"
          >
            <Plus size={15} /> New Battle
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Sessions", value: sessions.length, icon: Swords, color: "text-violet-500" },
            { label: "Active Now", value: active.filter(s => s.status === "active").length, icon: Zap, color: "text-emerald-500" },
            { label: "Students Reached", value: sessions.reduce((s, ss) => s + ss.participants_count, 0), icon: Users, color: "text-blue-500" },
          ].map(stat => (
            <div key={stat.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-4">
              <stat.icon size={16} className={`${stat.color} mb-2`} />
              <p className="text-2xl font-black text-slate-800 dark:text-white">{stat.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Sessions */}
        {loadingSessions ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="animate-spin text-violet-400 w-6 h-6" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-10 text-center">
            <Swords size={32} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="font-bold text-slate-500">No sessions yet</p>
            <p className="text-sm text-slate-400 mt-1">Create your first one above!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {active.length > 0 && (
              <>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Active / Lobby</h3>
                {active.map(s => <SessionRow key={s.id} session={s} onReport={() => loadReport(s)} />)}
              </>
            )}
            {finished.length > 0 && (
              <>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mt-4">Finished</h3>
                {finished.map(s => <SessionRow key={s.id} session={s} onReport={() => loadReport(s)} />)}
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // RENDER — REPORT VIEW
  // ════════════════════════════════════════════════════════════
  if (reportSession && reportData) {
    const { participants, answers, questions: rqs } = reportData;
    const qMap: Record<string, number[]> = {};
    rqs.forEach((q: any) => {
      const qAnswers = answers.filter((a: any) => a.question_id === q.id);
      const correct = qAnswers.filter((a: any) => a.is_correct).length;
      qMap[q.id] = [correct, qAnswers.length];
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => { setReportSession(null); setReportData(null); }} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ArrowLeft size={18} className="text-slate-500" />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white">Battle Report</h2>
            <p className="text-xs text-slate-400">{reportSession.quiz?.title} · {formatDistanceToNow(new Date(reportSession.created_at), { addSuffix: true })}</p>
          </div>
        </div>

        {loadingReport ? (
          <div className="flex items-center justify-center h-32"><Loader2 className="animate-spin text-violet-400 w-6 h-6" /></div>
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Players", value: participants.length, icon: Users },
                { label: "Questions", value: rqs.length, icon: BookOpen },
                { label: "Avg Correct", value: rqs.length > 0 ? `${Math.round((answers.filter((a: any) => a.is_correct).length / Math.max(rqs.length * participants.length, 1)) * 100)}%` : "—", icon: Target },
              ].map(stat => (
                <div key={stat.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-4 text-center">
                  <stat.icon size={16} className="text-violet-400 mx-auto mb-1" />
                  <p className="text-2xl font-black text-slate-800 dark:text-white">{stat.value}</p>
                  <p className="text-xs text-slate-400">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Podium */}
            {participants.length > 0 && (
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6">
                <h3 className="text-xs font-black text-white/50 uppercase tracking-wider mb-5 text-center">Podium</h3>
                <div className="flex items-end justify-center gap-4">
                  {[1, 0, 2].map((pos) => {
                    const p = participants[pos];
                    if (!p) return <div key={pos} className="w-24" />;
                    const rank = pos + 1;
                    const heights = ["h-20", "h-28", "h-16"];
                    return (
                      <div key={pos} className="flex flex-col items-center gap-2">
                        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-lg font-black text-white", pos === 0 ? "bg-yellow-500" : pos === 1 ? "bg-slate-400" : "bg-amber-600")}>
                          {p.display_name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <p className="text-xs font-bold text-white truncate max-w-[80px] text-center">{p.display_name}</p>
                        <p className="text-[10px] text-white/50">{p.score} pts</p>
                        <div className={cn("w-20 rounded-t-xl flex items-center justify-center", heights[pos],
                          pos === 0 ? "bg-yellow-500/20 border-t-2 border-yellow-400" :
                          pos === 1 ? "bg-slate-500/20 border-t-2 border-slate-400" :
                          "bg-amber-600/20 border-t-2 border-amber-600")}>
                          <span className={cn("text-2xl font-black", medalColor(rank))}>#{rank}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Full rankings */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 dark:border-white/10">
                <h3 className="font-black text-slate-700 dark:text-white text-sm">All Players</h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {participants.map((p: any, i: number) => {
                  const pAnswers = answers.filter((a: any) => a.user_id === p.user_id);
                  const correct = pAnswers.filter((a: any) => a.is_correct).length;
                  return (
                    <div key={p.user_id} className="flex items-center gap-4 px-5 py-3">
                      <span className={cn("w-6 text-center font-black text-sm", medalColor(i + 1))}>#{i + 1}</span>
                      <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-sm font-black text-violet-600 dark:text-violet-300 flex-shrink-0">
                        {p.display_name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-slate-800 dark:text-white truncate">{p.display_name}</p>
                        <p className="text-xs text-slate-400">{correct}/{rqs.length} correct</p>
                      </div>
                      <span className="font-black text-violet-600 dark:text-violet-400 text-sm">{p.score} pts</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Per-question breakdown */}
            {rqs.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 dark:border-white/10">
                  <h3 className="font-black text-slate-700 dark:text-white text-sm">Question-by-Question</h3>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {rqs.map((q: any, i: number) => {
                    const [correct, total] = qMap[q.id] ?? [0, 0];
                    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
                    return (
                      <div key={q.id} className="px-5 py-4">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex-1">
                            <span className="text-slate-400 mr-2">Q{i + 1}.</span>{q.question_text}
                          </p>
                          <span className={cn("text-sm font-black flex-shrink-0", pct >= 70 ? "text-emerald-500" : pct >= 40 ? "text-amber-500" : "text-red-500")}>
                            {pct}%
                          </span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all", pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500")}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{correct} / {total} answered correctly</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // RENDER — SETUP: CHOOSE / CREATE QUIZ
  // ════════════════════════════════════════════════════════════
  if (phase === "setup_quiz") {
    const filteredQuizzes = quizzes.filter(q =>
      !quizSearch || q.title.toLowerCase().includes(quizSearch.toLowerCase())
    );

    return (
      <div className="space-y-5 max-w-3xl">
        <div className="flex items-center gap-3">
          <button onClick={() => setPhase("list")} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ArrowLeft size={18} className="text-slate-500" />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white">Step 1 — Choose a Quiz</h2>
            <p className="text-xs text-slate-400">Use an existing quiz or build a new one</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1 max-w-xs">
          {(["existing", "new"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setQuizTab(tab)}
              className={cn("flex-1 py-2 rounded-lg text-sm font-bold transition-all", quizTab === tab
                ? "bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              {tab === "existing" ? "Existing Quiz" : "Build New"}
            </button>
          ))}
        </div>

        {quizTab === "existing" ? (
          <>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={quizSearch}
                onChange={e => setQuizSearch(e.target.value)}
                placeholder="Search quizzes…"
                className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-violet-400 transition-colors"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredQuizzes.map(q => (
                <button
                  key={q.id}
                  onClick={() => setSelectedQuizId(q.id)}
                  className={cn("p-4 rounded-xl text-left border-2 transition-all",
                    selectedQuizId === q.id
                      ? "border-violet-500 bg-violet-50 dark:bg-violet-500/10"
                      : "border-slate-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-700"
                  )}
                >
                  <p className="font-bold text-sm text-slate-800 dark:text-white">{q.title}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-slate-400">{q.questionCount} questions</span>
                    {q.difficulty_level && (
                      <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-md", diffColor[q.difficulty_level] ?? "")}>{q.difficulty_level}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
            {filteredQuizzes.length === 0 && (
              <p className="text-center text-slate-400 text-sm py-8">No quizzes found</p>
            )}
          </>
        ) : (
          /* ── NEW QUIZ BUILDER ── */
          <div className="space-y-5">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-5 space-y-4">
              <h3 className="font-black text-slate-700 dark:text-white">Quiz Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Title *</label>
                  <input value={newQuizForm.title} onChange={e => setNewQuizForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. French Vocabulary Challenge" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-violet-400 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Language</label>
                  <select value={newQuizForm.target_language} onChange={e => setNewQuizForm(f => ({ ...f, target_language: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:outline-none">
                    {LANGUAGES.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Difficulty</label>
                  <select value={newQuizForm.difficulty_level} onChange={e => setNewQuizForm(f => ({ ...f, difficulty_level: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:outline-none">
                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Questions */}
            {newQuestions.map((q, qi) => (
              <div key={qi} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-violet-500 uppercase tracking-wider">Question {qi + 1}</span>
                  <div className="flex items-center gap-2">
                    {/* Type toggle */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 gap-0.5">
                      {(["multiple_choice", "true_false"] as QuestionType[]).map(type => (
                        <button
                          key={type}
                          onClick={() => changeQuestionType(qi, type)}
                          className={cn("px-2 py-1 rounded-md text-[10px] font-bold transition-all", q.question_type === type
                            ? "bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm"
                            : "text-slate-400 hover:text-slate-600"
                          )}
                        >
                          {type === "multiple_choice" ? "4 Options" : "True/False"}
                        </button>
                      ))}
                    </div>
                    {newQuestions.length > 1 && (
                      <button onClick={() => removeQuestion(qi)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <input
                  value={q.question_text}
                  onChange={e => updateQuestion(qi, "question_text", e.target.value)}
                  placeholder="Enter your question…"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-violet-400 transition-colors"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className={cn("flex items-center gap-2 p-2.5 rounded-xl border-2 transition-colors", opt.is_correct ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20" : "border-slate-200 dark:border-white/10")}>
                      <span className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black flex-shrink-0", OPT_STYLES[oi]?.bg ?? "bg-slate-400")}>
                        {q.question_type === "true_false" ? opt.option_text[0] : OPT_STYLES[oi]?.label}
                      </span>
                      {q.question_type === "multiple_choice" ? (
                        <input
                          value={opt.option_text}
                          onChange={e => updateOption(qi, oi, "option_text", e.target.value)}
                          placeholder={`Option ${OPT_STYLES[oi]?.label}`}
                          className="flex-1 bg-transparent text-sm text-slate-700 dark:text-white outline-none placeholder:text-slate-300"
                        />
                      ) : (
                        <span className="flex-1 text-sm text-slate-700 dark:text-white font-semibold">{opt.option_text}</span>
                      )}
                      <button
                        type="button"
                        onClick={() => updateOption(qi, oi, "is_correct", true)}
                        title="Mark as correct"
                        className={cn("w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors", opt.is_correct ? "border-emerald-500 bg-emerald-500" : "border-slate-300 dark:border-slate-600 hover:border-emerald-400")}
                      />
                    </div>
                  ))}
                </div>

                <input
                  value={q.explanation}
                  onChange={e => updateQuestion(qi, "explanation", e.target.value)}
                  placeholder="Explanation (optional — shown after reveal)"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded text-xs text-slate-500 focus:outline-none focus:border-violet-300 transition-colors"
                />

                {/* Per-question time limit */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 mb-1.5 flex items-center gap-1">
                    <Timer size={10} /> Time limit:
                    <span className="text-violet-500">{q.time_limit > 0 ? `${q.time_limit}s` : "use global"}</span>
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {Q_TIME_OPTIONS.map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => updateQuestionTime(qi, t)}
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold border transition-all",
                          q.time_limit === t
                            ? "bg-violet-600 text-white border-violet-600"
                            : "border-slate-200 dark:border-white/10 text-slate-500 hover:border-violet-400"
                        )}
                      >
                        {t === 0 ? "global" : `${t}s`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Add question buttons */}
            <div className="flex flex-wrap gap-2">
              <button onClick={() => addQuestion("multiple_choice")} className="flex items-center gap-2 px-3 py-2 border-2 border-dashed border-slate-300 dark:border-white/20 text-slate-500 hover:text-violet-600 hover:border-violet-400 rounded text-sm font-bold transition-colors">
                <Plus size={14} /> 4-Option
              </button>
              <button onClick={() => addQuestion("true_false")} className="flex items-center gap-2 px-3 py-2 border-2 border-dashed border-slate-300 dark:border-white/20 text-slate-500 hover:text-violet-600 hover:border-violet-400 rounded text-sm font-bold transition-colors">
                <Plus size={14} /> True/False
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => { if (quizTab === "existing" && !selectedQuizId) { toast.error("Select a quiz"); return; } setPhase("setup_config"); }}
          className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-black rounded flex items-center justify-center gap-2 transition-colors"
        >
          Next: Configure Game →
        </button>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // RENDER — SETUP: CONFIGURE
  // ════════════════════════════════════════════════════════════
  if (phase === "setup_config") {
    return (
      <div className="space-y-6 max-w-xl pb-24 md:pb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setPhase("setup_quiz")} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ArrowLeft size={18} className="text-slate-500" />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white">Step 2 — Configure</h2>
            <p className="text-xs text-slate-400">Set time per question (10–70 seconds)</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-6 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <Timer size={18} className="text-violet-500" />
            <h3 className="font-black text-slate-700 dark:text-white">Time Per Question</h3>
          </div>

          {/* Current value display */}
          <div className="text-center py-4">
            <span className="text-6xl font-black text-violet-600 dark:text-violet-400">{timeSecs}</span>
            <span className="text-xl text-slate-400 ml-2">seconds</span>
          </div>

          {/* Segmented time picker */}
          <div className="flex flex-wrap gap-2 justify-center">
            {TIME_OPTIONS.map(t => (
              <button
                key={t}
                onClick={() => setTimeSecs(t)}
                className={cn("px-3 py-2 rounded-xl text-sm font-bold transition-all border-2", timeSecs === t
                  ? "bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-500/30"
                  : "border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-violet-400"
                )}
              >
                {t}s
              </button>
            ))}
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-xs text-slate-500 space-y-1">
            <p className="font-semibold">Tips:</p>
            <p>· 10–15s — fast-paced, ideal for simple vocabulary</p>
            <p>· 20–30s — balanced, good for most question types</p>
            <p>· 45–70s — reading/reasoning questions</p>
          </div>
        </div>

        <button
          onClick={handleCreateSession}
          disabled={creatingSession}
          className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-black rounded flex items-center justify-center gap-2 transition-colors"
        >
          {creatingSession ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play size={15} />}
          {creatingSession ? "Creating…" : "Create Battle Room →"}
        </button>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // RENDER — LOBBY (HOST)
  // ════════════════════════════════════════════════════════════
  if (phase === "lobby") {
    const realPlayers = players.filter(p => p.id !== currentUser.id);
    return (
      <div className="space-y-5 max-w-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-800 dark:text-white">Battle Lobby</h2>
          <button onClick={handleReset} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Cancel">
            <XCircle size={18} className="text-red-400" />
          </button>
        </div>

        {/* Join code */}
        <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl p-6 text-center">
          <p className="text-white/70 text-sm font-semibold mb-2">Share this code with your students</p>
          <div className="flex items-center justify-center gap-4">
            <span className="text-5xl font-black text-white tracking-[.15em]">{joinCode}</span>
            <button
              onClick={() => { navigator.clipboard.writeText(joinCode); toast.success("Copied!"); }}
              className="p-2.5 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
            >
              <Copy size={18} className="text-white" />
            </button>
          </div>
          <p className="text-white/50 text-xs mt-3">go to Quiz → Coopetition</p>
        </div>

        {/* Timer info */}
        <div className="flex items-center gap-2 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 px-4 py-2.5 rounded-xl">
          <Timer size={15} />
          <span className="text-sm font-semibold">{timeSecs} seconds per question</span>
        </div>

        {/* Players */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-white/10">
            <h3 className="font-black text-slate-700 dark:text-white text-sm">Players Joined</h3>
            <span className="text-xs font-bold text-violet-500 bg-violet-50 dark:bg-violet-900/30 px-2 py-0.5 rounded-full">{realPlayers.length}</span>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {realPlayers.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                <Users size={24} className="mx-auto mb-2 opacity-40" />
                Waiting for students to join…
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {realPlayers.map(p => (
                  <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-sm font-black text-violet-600 dark:text-violet-300">
                      {p.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <span className="text-sm font-semibold text-slate-700 dark:text-white">{p.name}</span>
                    <CheckCircle2 size={14} className="ml-auto text-emerald-400" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleStartGame}
          disabled={startingGame}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-colors text-base"
        >
          {startingGame ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play size={18} />}
          {startingGame ? "Starting…" : `Start Battle! (${realPlayers.length} player${realPlayers.length !== 1 ? "s" : ""})`}
        </button>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // RENDER — QUESTION (HOST VIEW)
  // ════════════════════════════════════════════════════════════
  const curQ    = questions[qIdx];
  const options = curQ?.options ?? curQ?.question_options ?? [];

  if (phase === "question" && curQ) {
    return (
      <div className="space-y-5 max-w-2xl">
        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-black text-slate-400 uppercase">Q {qIdx + 1} / {questions.length}</span>
          <div className="flex-1 h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${((qIdx + 1) / questions.length) * 100}%` }} />
          </div>
          <button onClick={handleSkip} className="text-xs font-bold text-slate-400 hover:text-violet-500 transition-colors px-2 py-1 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20">
            Skip →
          </button>
        </div>

        {/* Timer + answered */}
        <div className="flex items-center gap-4">
          <div className={cn("flex items-center gap-2 px-4 py-2 rounded-xl font-black text-lg", timeLeft <= 5 ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400")}>
            <Timer size={16} /> {timeLeft}s
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300">
            <Users size={14} /> <span className="font-bold text-sm">{answeredCount} / {players.filter(p => p.id !== currentUser.id).length} answered</span>
          </div>
        </div>

        {/* Question */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6">
          <p className="text-white text-xl font-black leading-snug">{curQ.question_text}</p>
          {curQ.question_type === "true_false" && (
            <span className="inline-block mt-2 text-[10px] font-bold text-white/40 uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded">True / False</span>
          )}
        </div>

        {/* Options grid */}
        <div className={cn("grid gap-3", options.length === 2 ? "grid-cols-2" : "grid-cols-2")}>
          {options.map((opt: any, oi: number) => (
            <div key={opt.id} className={cn("flex items-center gap-3 p-4 rounded-2xl text-white font-bold", OPT_STYLES[oi]?.bg ?? "bg-slate-500")}>
              <span className="text-xl">{OPT_STYLES[oi]?.shape}</span>
              <span className="text-sm leading-snug">{opt.option_text}</span>
            </div>
          ))}
        </div>

        {/* Live scoreboard */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-100 dark:border-white/10">
            <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Live Standings</p>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-white/5 max-h-40 overflow-y-auto">
            {[...players].sort((a, b) => b.score - a.score).map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-2">
                <span className="text-xs font-black text-slate-400 w-5">#{i + 1}</span>
                <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-xs font-black text-violet-600 dark:text-violet-300 flex-shrink-0">
                  {p.name?.[0]?.toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-white flex-1 truncate">{p.name}</span>
                <span className="text-xs font-black text-violet-600 dark:text-violet-400">{p.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // RENDER — REVEAL (HOST)
  // ════════════════════════════════════════════════════════════
  if (phase === "reveal" && curQ) {
    return (
      <div className="space-y-5 max-w-2xl">
        <div className="flex items-center gap-3">
          <span className="text-xs font-black text-slate-400 uppercase">Reveal — Q {qIdx + 1}</span>
        </div>
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-center">
          <p className="text-white font-black text-xl">{curQ.question_text}</p>
          {curQ.explanation && <p className="text-white/50 text-sm mt-2">{curQ.explanation}</p>}
        </div>
        <div className={cn("grid gap-3", options.length === 2 ? "grid-cols-2" : "grid-cols-2")}>
          {options.map((opt: any, oi: number) => (
            <div key={opt.id} className={cn("flex items-center gap-3 p-4 rounded-2xl font-bold transition-all",
              opt.id === correctId
                ? "bg-emerald-500 text-white ring-4 ring-emerald-400/50 scale-105"
                : "bg-slate-800 text-white/40"
            )}>
              <span className="text-xl">{OPT_STYLES[oi]?.shape}</span>
              <span className="text-sm">{opt.option_text}</span>
              {opt.id === correctId && <CheckCircle2 size={16} className="ml-auto" />}
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
          <div className="px-4 py-2 border-b"><p className="text-xs font-black text-slate-400 uppercase tracking-wider">Updated Standings</p></div>
          <div className="divide-y divide-slate-100 dark:divide-white/5 max-h-48 overflow-y-auto">
            {[...players].sort((a, b) => b.score - a.score).map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                <span className={cn("text-xs font-black w-5", medalColor(i + 1))}>#{i + 1}</span>
                <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-xs font-black text-violet-600 dark:text-violet-300 flex-shrink-0">
                  {p.name?.[0]?.toUpperCase()}
                </div>
                <span className="text-sm font-semibold flex-1 truncate text-slate-700 dark:text-white">{p.name}</span>
                <span className="text-sm font-black text-violet-600 dark:text-violet-400">{p.score} pts</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-center text-sm text-slate-400 animate-pulse">Next question starting soon…</p>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // RENDER — FINISHED
  // ════════════════════════════════════════════════════════════
  if (phase === "finished") {
    return (
      <div className="space-y-5 max-w-xl text-center">
        <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl p-8 text-white">
          <Trophy size={40} className="mx-auto mb-3 text-yellow-300" />
          <h2 className="text-3xl font-black">Battle Complete!</h2>
          <p className="text-white/70 mt-1 text-sm">The report has been saved</p>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-white/5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
          {[...players].sort((a, b) => b.score - a.score).slice(0, 5).map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 px-5 py-3">
              <span className={cn("text-sm font-black w-6 text-center", medalColor(i + 1))}>#{i + 1}</span>
              <span className="flex-1 text-sm font-semibold text-slate-700 dark:text-white text-left">{p.name}</span>
              <span className="text-sm font-black text-violet-600 dark:text-violet-400">{p.score} pts</span>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={handleReset} className="flex-1 py-3 border-2 border-slate-200 dark:border-white/10 text-slate-700 dark:text-white font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            ← Back to Sessions
          </button>
          <button onClick={() => { const s = sessions.find(s => s.join_code === joinCode); if (s) loadReport(s); }} className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-2xl transition-colors flex items-center justify-center gap-2">
            <BarChart3 size={15} /> View Report
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// ─ Session Row ────────────────────────────────────────────────
function SessionRow({ session, onReport }: { session: Session; onReport: () => void }) {
  const statusColors: Record<string, string> = {
    lobby: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    finished: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  };

  return (
    <div className="flex items-center gap-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 px-5 py-4">
      <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
        <Swords size={16} className="text-violet-600 dark:text-violet-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-slate-800 dark:text-white truncate">{session.quiz?.title ?? "—"}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-slate-400">{session.participants_count} players · {session.time_per_question}s/q</span>
          <span className="text-xs text-slate-300 dark:text-slate-600">·</span>
          <span className="text-xs text-slate-400">{formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}</span>
        </div>
      </div>
      <span className={cn("text-[10px] font-black uppercase px-2 py-0.5 rounded-full", statusColors[session.status] ?? statusColors.finished)}>
        {session.status}
      </span>
      {session.status === "finished" && (
        <button onClick={onReport} className="flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/20 dark:hover:bg-violet-900/30 px-3 py-1.5 rounded-lg transition-colors">
          <BarChart3 size={13} /> Report
        </button>
      )}
    </div>
  );
}

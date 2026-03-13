"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Zap, Users, Trophy, Copy, Play, CheckCircle2, XCircle,
  Swords, RefreshCw, Loader2, LogIn, Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─ Constants ─────────────────────────────────────────────────
const Q_SECS_DEFAULT = 15;
const REV_SECS       = 5;

const OPT = [
  { bg: "bg-[#E21B3C] hover:brightness-110", shape: "▲", letter: "A" },
  { bg: "bg-[#1368CE] hover:brightness-110", shape: "◆", letter: "B" },
  { bg: "bg-[#D89E00] hover:brightness-110", shape: "●", letter: "C" },
  { bg: "bg-[#26890C] hover:brightness-110", shape: "■", letter: "D" },
] as const;

// ─ Types ─────────────────────────────────────────────────────
type Phase = "idle" | "lobby" | "question" | "reveal" | "finished";

interface Player {
  id: string;
  name: string;
  avatar?: string | null;
  score: number;
}

interface Props {
  currentUser: { id: string; full_name: string; avatar_url?: string | null };
  quizzes: Array<{ id: string; title: string; questionCount: number }>;
}

// ─ Component ─────────────────────────────────────────────────
export function CoopetitionClient({ currentUser, quizzes }: Props) {
  const supabase = createClient();

  // Stable refs (accessed inside callbacks without stale-closure issues)
  const chanRef        = useRef<any>(null);
  const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const revTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHostRef      = useRef(false);
  const qIdxRef        = useRef(0);
  const questionsRef   = useRef<any[]>([]);
  const playersRef     = useRef<Player[]>([]);
  const sessionIdRef   = useRef("");
  const selectedQzRef  = useRef("");
  const answersRef     = useRef<Record<string, string>>({});   // {userId: optionId}
  const revFiredRef    = useRef(false);

  // React state
  const [phase, setPhase]               = useState<Phase>("idle");
  const [isHost, setIsHost]             = useState(false);
  const [joinCode, setJoinCode]         = useState("");
  const [joinInput, setJoinInput]       = useState("");
  const [selectedQuiz, setSelectedQuiz] = useState("");
  const [players, setPlayers]           = useState<Player[]>([]);
  const [questions, setQuestions]       = useState<any[]>([]);
  const [qIdx, setQIdx]                 = useState(0);
  const [timeLeft, setTimeLeft]         = useState(Q_SECS_DEFAULT);
  const [myAnswer, setMyAnswer]         = useState<string | null>(null);
  const [correctId, setCorrectId]       = useState<string | null>(null);
  const [qSecs, setQSecs]               = useState(Q_SECS_DEFAULT);
  const qSecsRef                        = useRef(Q_SECS_DEFAULT);
  const [showCreate, setShowCreate]     = useState(false);
  const [showJoin, setShowJoin]         = useState(false);
  const [creatingGame, setCreatingGame] = useState(false);
  const [joiningGame, setJoiningGame]   = useState(false);
  const [startingGame, setStartingGame] = useState(false);

  // Keep refs in sync with state
  useEffect(() => { qIdxRef.current = qIdx; }, [qIdx]);
  useEffect(() => { questionsRef.current = questions; }, [questions]);
  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { selectedQzRef.current = selectedQuiz; }, [selectedQuiz]);
  useEffect(() => { qSecsRef.current = qSecs; }, [qSecs]);

  // ─ Cleanup on unmount ─
  useEffect(() => () => {
    clearAllTimers();
    if (chanRef.current) supabase.removeChannel(chanRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const clearAllTimers = () => {
    if (timerRef.current)    { clearInterval(timerRef.current); timerRef.current = null; }
    if (revTimerRef.current) { clearTimeout(revTimerRef.current);  revTimerRef.current = null; }
  };

  // ─ Reveal logic (host only, uses refs to avoid stale closure) ─
  const doReveal = useCallback(() => {
    if (!isHostRef.current || revFiredRef.current) return;
    revFiredRef.current = true;
    clearAllTimers();

    const curQ    = questionsRef.current[qIdxRef.current];
    if (!curQ) return;
    const opts    = curQ.options || curQ.question_options || [];
    const correct = opts.find((o: any) => o.is_correct);
    if (!correct) return;

    const cid     = correct.id as string;
    const recs    = { ...answersRef.current };

    // Score round: 100pts per correct
    const updated = playersRef.current.map(p => ({
      ...p,
      score: p.score + (recs[p.id] === cid ? 100 : 0),
    }));
    playersRef.current = updated;
    setPlayers(updated);
    setCorrectId(cid);
    setPhase("reveal");
    answersRef.current = {};

    chanRef.current?.send({
      type: "broadcast", event: "game_reveal",
      payload: { correctId: cid, players: updated },
    });

    // Auto-advance
    revTimerRef.current = setTimeout(async () => {
      const nextIdx = qIdxRef.current + 1;
      const qs = questionsRef.current;
      if (nextIdx >= qs.length) {
        // End game
        setPhase("finished");
        chanRef.current?.send({ type: "broadcast", event: "game_end", payload: { players: updated } });
        // Persist final scores
        for (const p of updated) {
          await supabase
            .from("coopetition_participants")
            .update({ score: p.score })
            .eq("session_id", sessionIdRef.current)
            .eq("user_id", p.id);
        }
        await supabase
          .from("coopetition_sessions")
          .update({ status: "finished" })
          .eq("id", sessionIdRef.current);
      } else {
        revFiredRef.current = false;
        setQIdx(nextIdx);
        setMyAnswer(null);
        setCorrectId(null);
        setPhase("question");
        chanRef.current?.send({
          type: "broadcast", event: "game_question",
          payload: { index: nextIdx },
        });
      }
    }, REV_SECS * 1000);
  }, [supabase]);

  // ─ Countdown when in question phase ─
  useEffect(() => {
    if (phase !== "question") return;
    clearAllTimers();
    revFiredRef.current = false;
    const curQ = questionsRef.current[qIdxRef.current];
    const t0   = (curQ?.time_limit > 0 ? curQ.time_limit : qSecsRef.current) || Q_SECS_DEFAULT;
    setTimeLeft(t0);
    let t = t0;
    timerRef.current = setInterval(() => {
      t--;
      setTimeLeft(t);
      if (t <= 0) {
        clearAllTimers();
        if (isHostRef.current) doReveal();
      }
    }, 1000);
    return clearAllTimers;
  }, [phase, qIdx, doReveal]);

  // ─ Subscribe to Realtime channel ─
  const subscribe = useCallback((sid: string) => {
    if (chanRef.current) {
      supabase.removeChannel(chanRef.current);
      chanRef.current = null;
    }
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
      .on("broadcast", { event: "game_start" }, ({ payload }) => {
        if (isHostRef.current) return;
        if (payload.timeSecs) { qSecsRef.current = payload.timeSecs; setQSecs(payload.timeSecs); }
        questionsRef.current = payload.questions;
        setQuestions(payload.questions);
        qIdxRef.current = 0;
        setQIdx(0);
        setMyAnswer(null);
        setCorrectId(null);
        setPhase("question");
      })
      .on("broadcast", { event: "game_question" }, ({ payload }) => {
        if (isHostRef.current) return;
        qIdxRef.current = payload.index;
        setQIdx(payload.index);
        setMyAnswer(null);
        setCorrectId(null);
        setPhase("question");
      })
      .on("broadcast", { event: "game_reveal" }, ({ payload }) => {
        if (isHostRef.current) return;
        setCorrectId(payload.correctId);
        playersRef.current = payload.players;
        setPlayers(payload.players);
        setPhase("reveal");
      })
      .on("broadcast", { event: "game_end" }, ({ payload }) => {
        if (isHostRef.current) return;
        playersRef.current = payload.players;
        setPlayers(payload.players);
        setPhase("finished");
      })
      .on("broadcast", { event: "player_answer" }, ({ payload }) => {
        if (!isHostRef.current) return;
        answersRef.current[payload.userId] = payload.optionId;
      })
      .subscribe();

    chanRef.current = chan;
  }, [supabase]);

  // ─ Create session ─
  const handleCreate = async () => {
    if (!selectedQuiz) { toast.error("Select a quiz first"); return; }
    setCreatingGame(true);
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data: session, error } = await supabase
      .from("coopetition_sessions")
      .insert({ quiz_id: selectedQuiz, host_id: currentUser.id, join_code: code, status: "lobby", time_per_question: qSecsRef.current })
      .select("id")
      .single();

    if (error) { toast.error("Could not create game"); setCreatingGame(false); return; }

    await supabase.from("coopetition_participants").insert({
      session_id: session.id,
      user_id: currentUser.id,
      display_name: currentUser.full_name,
      avatar_url: currentUser.avatar_url ?? null,
    });

    isHostRef.current = true;
    const me: Player = { id: currentUser.id, name: currentUser.full_name, avatar: currentUser.avatar_url, score: 0 };
    playersRef.current = [me];
    setIsHost(true);
    setJoinCode(code);
    setPlayers([me]);
    subscribe(session.id);
    setPhase("lobby");
    setCreatingGame(false);
  };

  // ─ Join session ─
  const handleJoin = async () => {
    const code = joinInput.trim().toUpperCase();
    if (code.length < 4) { toast.error("Enter a valid game code"); return; }
    setJoiningGame(true);

    const { data: session, error } = await supabase
      .from("coopetition_sessions")
      .select("id, status")
      .eq("join_code", code)
      .single();

    if (error || !session) { toast.error("Game not found. Check your code."); setJoiningGame(false); return; }
    if (session.status !== "lobby") { toast.error("This game has already started"); setJoiningGame(false); return; }

    const { error: pErr } = await supabase.from("coopetition_participants").upsert({
      session_id: session.id,
      user_id: currentUser.id,
      display_name: currentUser.full_name,
      avatar_url: currentUser.avatar_url ?? null,
      score: 0,
    }, { onConflict: "session_id,user_id" });

    if (pErr) { toast.error("Could not join game"); setJoiningGame(false); return; }

    // Fetch current participants
    const { data: parts } = await supabase
      .from("coopetition_participants")
      .select("user_id, display_name, avatar_url, score")
      .eq("session_id", session.id);

    const pl: Player[] = (parts ?? []).map((p: any) => ({
      id: p.user_id, name: p.display_name, avatar: p.avatar_url, score: p.score,
    }));

    isHostRef.current = false;
    playersRef.current = pl;
    setIsHost(false);
    setPlayers(pl);
    setJoinCode(code);
    subscribe(session.id);

    // Announce join (small delay for subscription to settle)
    setTimeout(() => {
      chanRef.current?.send({
        type: "broadcast", event: "player_joined",
        payload: { id: currentUser.id, name: currentUser.full_name, avatar: currentUser.avatar_url },
      });
    }, 300);

    setPhase("lobby");
    setJoiningGame(false);
  };

  // ─ Start game (host only) ─
  const handleStart = async () => {
    setStartingGame(true);
    const { data: qs, error } = await supabase
      .from("questions")
      .select("id, quiz_id, question_text, explanation, time_limit, options:question_options(id, option_text, is_correct)")
      .eq("quiz_id", selectedQzRef.current)
      .order("created_at", { ascending: true });

    if (error || !qs?.length) { toast.error("Could not load questions"); setStartingGame(false); return; }

    await supabase
      .from("coopetition_sessions")
      .update({ status: "active" })
      .eq("id", sessionIdRef.current);

    questionsRef.current = qs;
    qIdxRef.current = 0;
    revFiredRef.current = false;
    setQuestions(qs);
    setQIdx(0);
    setMyAnswer(null);
    setCorrectId(null);

    chanRef.current?.send({ type: "broadcast", event: "game_start", payload: { questions: qs, timeSecs: qSecsRef.current } });
    setPhase("question");
    setStartingGame(false);
  };

  // ─ Submit answer ─
  const handleAnswer = (optionId: string) => {
    if (myAnswer !== null) return;
    setMyAnswer(optionId);
    // Store host's own answer directly in ref (host doesn't receive its own broadcast)
    answersRef.current[currentUser.id] = optionId;
    chanRef.current?.send({
      type: "broadcast", event: "player_answer",
      payload: { userId: currentUser.id, optionId },
    });
  };

  // ─ Reset / leave ─
  const handleReset = () => {
    clearAllTimers();
    if (chanRef.current) { supabase.removeChannel(chanRef.current); chanRef.current = null; }
    isHostRef.current = false;
    sessionIdRef.current = "";
    answersRef.current = {};
    revFiredRef.current = false;
    playersRef.current = [];
    questionsRef.current = [];
    qIdxRef.current = 0;
    setPhase("idle");
    setIsHost(false);
    setJoinCode("");
    setJoinInput("");
    setSelectedQuiz("");
    setPlayers([]);
    setQuestions([]);
    setQIdx(0);
    setMyAnswer(null);
    setCorrectId(null);
    setShowCreate(false);
    setShowJoin(false);
  };

  // ═════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════

  // ─ IDLE ─
  if (phase === "idle") {
    return (
      <div className="space-y-5">
        {/* Hero banner */}
        <div className="bg-gradient-to-br from-[#0d0f1c] to-[#1a1040] rounded-3xl p-8 text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <Swords className="w-8 h-8 text-yellow-400" />
            <h2 className="text-4xl font-black text-white tracking-tight">COOPETITION</h2>
          </div>
          <p className="text-white/60 font-medium max-w-sm mx-auto text-sm">
            Host a live quiz battle — classmates join with a code and compete in real-time!
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-w-xs mx-auto text-xs text-white/40 pt-1">
            {[
              { icon: "⚡", label: "Real-time battles" },
              { icon: "🏆", label: "Live leaderboard" },
              { icon: "⏱️", label: "Custom timer" },
            ].map(i => (
              <div key={i.label} className="flex items-center gap-1.5 justify-center">{i.icon} {i.label}</div>
            ))}
          </div>
          <div className="flex flex-col gap-3 justify-center max-w-xs mx-auto pt-3">
            <button
              onClick={() => { setShowCreate(true); setShowJoin(false); }}
              className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-black px-5 py-3 rounded transition-colors text-sm"
            >
              <Zap size={15} /> Create Game
            </button>
            <button
              onClick={() => { setShowJoin(true); setShowCreate(false); }}
              className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-black px-5 py-3 rounded transition-colors text-sm"
            >
              <LogIn size={15} /> Join Game
            </button>
          </div>
        </div>

        {/* Create form */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-white/10 p-4 space-y-3"
            >
              <h3 className="font-black text-slate-800 dark:text-white">Choose a Quiz</h3>
              {quizzes.length === 0 ? (
                <p className="text-slate-400 text-sm">No quizzes available yet.</p>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {quizzes.map(q => (
                    <button
                      key={q.id}
                      onClick={() => setSelectedQuiz(q.id)}
                      className={cn(
                        "p-3 rounded text-left border-2 transition-all",
                        selectedQuiz === q.id
                          ? "border-violet-500 bg-violet-50 dark:bg-violet-500/10"
                          : "border-slate-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-700"
                      )}
                    >
                      <p className="font-bold text-sm text-slate-800 dark:text-white">{q.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{q.questionCount} questions</p>
                    </button>
                  ))}
                </div>
              )}
              {/* Time per question */}
              <div>
                <p className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5">
                  <Timer size={12} /> Time per question: <span className="text-violet-600">{qSecs}s</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[10, 15, 20, 25, 30, 45, 60].map(t => (
                    <button key={t} onClick={() => { setQSecs(t); qSecsRef.current = t; }}
                      className={cn("px-2.5 py-1 rounded text-xs font-bold border transition-all",
                        qSecs === t ? "bg-violet-600 text-white border-violet-600" : "border-slate-200 dark:border-white/10 text-slate-500 hover:border-violet-400"
                      )}>{t}s</button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleCreate}
                disabled={!selectedQuiz || creatingGame}
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-black rounded flex items-center justify-center gap-2 transition-colors"
              >
                {creatingGame ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play size={15} />}
                {creatingGame ? "Creating…" : "Create Game"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Join form */}
        <AnimatePresence>
          {showJoin && (
            <motion.div
              key="join"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-white/10 p-4 space-y-3"
            >
              <h3 className="font-black text-slate-800 dark:text-white">Enter Game Code</h3>
              <input
                value={joinInput}
                onChange={e => setJoinInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === "Enter" && handleJoin()}
                placeholder="ABC123"
                maxLength={8}
                autoFocus
                className="w-full px-4 py-4 text-center text-4xl font-black tracking-[0.5em] border-2 border-slate-200 dark:border-white/10 rounded bg-transparent text-slate-800 dark:text-white focus:border-violet-500 outline-none transition-colors uppercase"
              />
              <button
                onClick={handleJoin}
                disabled={joinInput.length < 4 || joiningGame}
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-black rounded flex items-center justify-center gap-2 transition-colors"
              >
                {joiningGame ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn size={15} />}
                {joiningGame ? "Joining…" : "Join Game"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ─ LOBBY ─
  if (phase === "lobby") {
    return (
      <div className="space-y-4">
        {/* Code card */}
        <div className="bg-gradient-to-br from-[#0d0f1c] to-[#1a1040] rounded-3xl p-8 text-center">
          <p className="text-white/50 text-[10px] font-black uppercase tracking-[0.4em] mb-2">
            {isHost ? "Share this PIN" : "Joined!"}
          </p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-5xl font-black text-white tracking-[0.3em]">{joinCode}</span>
            {isHost && (
              <button
                onClick={() => { navigator.clipboard.writeText(joinCode); toast.success("Code copied!"); }}
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
              >
                <Copy size={16} />
              </button>
            )}
          </div>
          {!isHost && (
            <p className="text-white/50 text-sm mt-4 font-medium animate-pulse">
              Waiting for the host to start the game…
            </p>
          )}
        </div>

        {/* Player list */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-violet-500" />
            <h3 className="font-black text-slate-800 dark:text-white">
              Players <span className="text-violet-500">({players.length})</span>
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {players.map(p => (
              <div key={p.id} className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2.5",
                p.id === currentUser.id
                  ? "bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20"
                  : "bg-slate-50 dark:bg-slate-800"
              )}>
                <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0 overflow-hidden">
                  {p.avatar
                    ? <img src={p.avatar} alt={p.name} className="w-8 h-8 object-cover" />
                    : p.name[0]?.toUpperCase()
                  }
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-700 dark:text-white truncate">
                    {p.id === currentUser.id ? "You" : p.name}
                  </p>
                  {p.id === currentUser.id && isHost && (
                    <p className="text-[9px] text-violet-500 font-black uppercase">Host</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {isHost && (
          <button
            onClick={handleStart}
            disabled={startingGame || players.length < 1}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-black rounded flex items-center justify-center gap-2 text-lg transition-colors shadow-lg shadow-emerald-500/20"
          >
            {startingGame ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play size={20} />}
            {startingGame ? "Starting…" : `Start Game  (${players.length} player${players.length !== 1 ? "s" : ""})`}
          </button>
        )}

        <button
          onClick={handleReset}
          className="w-full py-2.5 text-sm text-slate-400 hover:text-red-500 font-bold transition-colors"
        >
          Leave Game
        </button>
      </div>
    );
  }

  // ─ QUESTION ─
  if (phase === "question") {
    const currentQ = questions[qIdx];
    const opts     = currentQ?.options || currentQ?.question_options || [];
    const qTotal   = (currentQ?.time_limit > 0 ? currentQ.time_limit : qSecsRef.current) || Q_SECS_DEFAULT;
    const pct      = (timeLeft / qTotal) * 100;
    const isLow    = timeLeft <= 5;

    return (
      <div className="rounded-3xl overflow-hidden bg-[#0d0f1c]">
        {/* Top bar */}
        <div className="bg-black/40 px-5 py-3 flex items-center gap-4">
          <span className="text-white/70 text-xs font-black uppercase tracking-widest">
            Q {qIdx + 1}<span className="text-white/30">/{questions.length}</span>
          </span>
          {/* Countdown circle */}
          <div className="flex-1 flex justify-center">
            <div className="relative w-14 h-14">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                <circle
                  cx="28" cy="28" r="22" fill="none"
                  stroke={isLow ? "#ef4444" : "#a78bfa"}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 22}`}
                  strokeDashoffset={`${(1 - pct / 100) * 2 * Math.PI * 22}`}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <span className={cn(
                "absolute inset-0 flex items-center justify-center text-xl font-black",
                isLow ? "text-red-400" : "text-white"
              )}>
                {timeLeft}
              </span>
            </div>
          </div>
          <span className="text-white/40 text-xs font-bold">
            <Users size={12} className="inline mr-1" />{players.length}
          </span>
        </div>

        {/* Question */}
        <div className="px-6 py-8 text-center">
          <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-3">Question {qIdx + 1}</p>
          <h2 className="text-2xl md:text-3xl font-black text-white leading-snug max-w-xl mx-auto">
            {currentQ?.question_text}
          </h2>
        </div>

        {/* Options */}
        <div className="px-4 pb-5 grid grid-cols-2 gap-3">
          {opts.slice(0, 4).map((opt: any, i: number) => {
            const style      = OPT[i];
            const isSelected = myAnswer === opt.id;
            const isAnswered = myAnswer !== null;

            return (
              <motion.button
                key={opt.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleAnswer(opt.id)}
                disabled={isAnswered}
                className={cn(
                  "relative p-5 rounded-2xl text-white font-bold text-sm min-h-[80px] flex items-start gap-3 text-left transition-all select-none",
                  style.bg,
                  isSelected && "ring-4 ring-white/80 scale-[0.97]",
                  isAnswered && !isSelected && "opacity-40 scale-[0.98]",
                )}
              >
                <span className="text-2xl leading-none flex-shrink-0">{style.shape}</span>
                <span className="leading-snug mt-0.5">{opt.option_text}</span>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-3 top-3 w-7 h-7 bg-white rounded-full flex items-center justify-center"
                  >
                    <CheckCircle2 className="w-4 h-4 text-slate-700" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>

        {myAnswer && (
          <div className="text-center py-3 bg-black/20">
            <p className="text-white/60 font-bold text-xs animate-pulse">
              Answer locked in! Waiting for others…
            </p>
          </div>
        )}
      </div>
    );
  }

  // ─ REVEAL ─
  if (phase === "reveal") {
    const currentQ     = questions[qIdx];
    const opts         = currentQ?.options || currentQ?.question_options || [];
    const wasCorrect   = myAnswer === correctId;
    const didAnswer    = myAnswer !== null;
    const sortedTop    = [...players].sort((a, b) => b.score - a.score).slice(0, 5);
    const myRankFull   = [...players].sort((a, b) => b.score - a.score).findIndex(p => p.id === currentUser.id) + 1;

    return (
      <div className="rounded-3xl overflow-hidden bg-[#0d0f1c]">
        {/* Result banner */}
        <div className={cn(
          "px-6 py-5 text-center",
          !didAnswer ? "bg-slate-600" : wasCorrect ? "bg-emerald-500" : "bg-[#E21B3C]"
        )}>
          <div className="flex items-center justify-center gap-2">
            {wasCorrect ? <CheckCircle2 className="w-6 h-6 text-white" /> : <XCircle className="w-6 h-6 text-white" />}
            <span className="text-white font-black text-xl">
              {!didAnswer ? "Time's up!" : wasCorrect ? "Correct! +100 pts" : "Wrong!"}
            </span>
          </div>
          {myRankFull > 0 && (
            <p className="text-white/70 text-xs mt-1 font-medium">You're #{myRankFull} with {players.find(p => p.id === currentUser.id)?.score ?? 0} pts</p>
          )}
        </div>

        {/* Options with correct highlighted */}
        <div className="px-4 pt-4 pb-2 grid grid-cols-2 gap-3">
          {opts.slice(0, 4).map((opt: any, i: number) => {
            const style     = OPT[i];
            const isCorrect = opt.id === correctId;
            return (
              <div
                key={opt.id}
                className={cn(
                  "p-4 rounded-2xl text-white font-bold text-sm min-h-[70px] flex items-start gap-3 relative transition-all",
                  isCorrect ? `${style.bg} ring-4 ring-white/80` : "bg-white/5 opacity-40"
                )}
              >
                <span className="text-xl flex-shrink-0">{style.shape}</span>
                <span className="leading-snug mt-0.5">{opt.option_text}</span>
                {isCorrect && <CheckCircle2 className="absolute right-3 top-3 w-5 h-5" />}
              </div>
            );
          })}
        </div>

        {/* Mini leaderboard */}
        <div className="px-4 pb-5 pt-2">
          <p className="text-white/40 text-[9px] font-black uppercase tracking-widest text-center mb-2">Top Players</p>
          <div className="space-y-1.5">
            {sortedTop.map((p, i) => (
              <div key={p.id} className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-2.5",
                p.id === currentUser.id ? "bg-violet-500/20" : "bg-white/5"
              )}>
                <span className="text-sm w-6 text-center">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}</span>
                <span className={cn("font-bold text-sm flex-1 truncate", p.id === currentUser.id ? "text-yellow-400" : "text-white")}>
                  {p.id === currentUser.id ? "You" : p.name}
                </span>
                <span className="text-yellow-400 font-black text-sm">{p.score}</span>
              </div>
            ))}
          </div>
          {isHost && (
            <p className="text-white/30 text-xs text-center mt-3 animate-pulse">
              <Timer size={11} className="inline mr-1" />Next question in {REV_SECS}s…
            </p>
          )}
        </div>

        {/* Explanation */}
        {currentQ?.explanation && (
          <div className="mx-4 mb-4 px-4 py-3 bg-white/5 rounded-2xl border border-white/10">
            <p className="text-white/50 text-xs leading-relaxed">{currentQ.explanation}</p>
          </div>
        )}
      </div>
    );
  }

  // ─ FINISHED ─
  if (phase === "finished") {
    const sorted  = [...players].sort((a, b) => b.score - a.score);
    const myRank  = sorted.findIndex(p => p.id === currentUser.id) + 1;
    const myScore = players.find(p => p.id === currentUser.id)?.score ?? 0;
    const maxScore = questions.length * 100;

    return (
      <div className="rounded-3xl overflow-hidden bg-[#0d0f1c]">
        {/* Header */}
        <div className="px-8 py-10 text-center bg-gradient-to-b from-violet-900/60 to-transparent">
          <Trophy className="w-14 h-14 text-yellow-400 mx-auto mb-3" />
          <h2 className="text-4xl font-black text-white tracking-tight">GAME OVER!</h2>
          <p className="text-white/60 font-medium mt-2">
            You finished <span className="text-yellow-400 font-black">#{myRank}</span> with{" "}
            <span className="text-yellow-400 font-black">{myScore}</span> / {maxScore} pts
          </p>
        </div>

        {/* Leaderboard */}
        <div className="px-4 pb-5 space-y-2">
          {sorted.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-5 py-3.5",
                p.id === currentUser.id
                  ? "bg-violet-500/25 border border-violet-500/30"
                  : "bg-white/5"
              )}
            >
              <span className="text-xl w-8 text-center">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}</span>
              <span className={cn("font-bold text-base flex-1 truncate", p.id === currentUser.id ? "text-yellow-400" : "text-white")}>
                {p.id === currentUser.id ? `You (${p.name})` : p.name}
              </span>
              <div className="text-right">
                <span className="text-yellow-400 font-black text-lg">{p.score}</span>
                <span className="text-white/30 text-xs ml-1">pts</span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="px-4 pb-6 text-center">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white font-black rounded-2xl transition-colors"
          >
            <RefreshCw size={16} />
            Play Again
          </button>
        </div>
      </div>
    );
  }

  return null;
}

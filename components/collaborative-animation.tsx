"use client";

import { useEffect, useState } from "react";

const PHRASES = [
  { fr: "Bonjour, comment ça va?", en: "Hello, how are you?" },
  { fr: "Je parle français maintenant.", en: "I speak French now." },
  { fr: "Ensemble, on apprend mieux.", en: "Together, we learn better." },
  { fr: "La collaboration, c'est la clé.", en: "Collaboration is the key." },
  { fr: "Chaque mot compte.", en: "Every word counts." },
];

const NODES = [
  { id: 1, x: 50, y: 15, label: "Kwame", flag: "🇬🇭", color: "#7c3aed" },
  { id: 2, x: 82, y: 38, label: "Amina", flag: "🇲🇦", color: "#0891b2" },
  { id: 3, x: 72, y: 75, label: "Pierre", flag: "🇫🇷", color: "#059669" },
  { id: 4, x: 28, y: 75, label: "Fatou", flag: "🇸🇳", color: "#d97706" },
  { id: 5, x: 18, y: 38, label: "Emre", flag: "🇹🇷", color: "#dc2626" },
];

const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [0, 2], [1, 3],
];

export function CollaborativeAnimation() {
  const [activePhrase, setActivePhrase] = useState(0);
  const [score, setScore] = useState(34);
  const [activeNode, setActiveNode] = useState(0);
  const [activeConn, setActiveConn] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const phraseInterval = setInterval(() => {
      setActivePhrase((p) => (p + 1) % PHRASES.length);
    }, 3200);
    const nodeInterval = setInterval(() => {
      setActiveNode((n) => (n + 1) % NODES.length);
    }, 1100);
    const connInterval = setInterval(() => {
      setActiveConn((c) => (c + 1) % CONNECTIONS.length);
    }, 700);
    const scoreInterval = setInterval(() => {
      setScore((s) => (s >= 98 ? 34 : s + 1));
    }, 80);
    return () => {
      clearInterval(phraseInterval);
      clearInterval(nodeInterval);
      clearInterval(connInterval);
      clearInterval(scoreInterval);
    };
  }, []);

  const phrase = PHRASES[activePhrase];

  return (
    <section className="w-full bg-white dark:bg-black border-t border-slate-100 dark:border-white/5 py-20 md:py-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* LEFT: Text */}
        <div className="space-y-8 order-2 lg:order-1">
          <div>
            <span className="text-[10px] font-black text-violet-600 uppercase tracking-[0.3em]">
              The Science Behind LML
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter mt-3 leading-tight">
              Language lives in<br />
              <span className="text-violet-600">connection</span>, not isolation.
            </h2>
          </div>

          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base leading-relaxed">
            When you learn with peers from your organisation, you get instant feedback, real context, and the emotional anchor that makes words stick permanently.
          </p>

          {/* Phrase flip */}
          <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-5 border border-slate-200 dark:border-white/10 space-y-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-violet-600" style={{ width: `${score}%`, transition: "width 80ms linear" }} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live phrase — shared by the community</p>
            <p key={activePhrase} className="text-lg font-black text-slate-900 dark:text-white leading-snug" style={{ animation: "fadeUp 0.4s ease" }}>
              {phrase.fr}
            </p>
            <p key={activePhrase + "en"} className="text-sm text-violet-600 font-semibold italic" style={{ animation: "fadeUp 0.5s ease 0.1s both" }}>
              {phrase.en}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: "80", label: "Days to fluency", unit: "avg" },
              { value: "5×", label: "Faster than solo", unit: "" },
              { value: "94%", label: "Retention rate", unit: "" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-black text-slate-900 dark:text-white">{s.value}<span className="text-slate-400 text-sm font-medium ml-0.5">{s.unit}</span></p>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Animation */}
        <div className="order-1 lg:order-2 flex justify-center">
          <div className="relative w-[340px] h-[340px] md:w-[420px] md:h-[420px]">

            {/* SVG connection lines */}
            {mounted && (
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {CONNECTIONS.map(([a, b], i) => {
                  const nodeA = NODES[a];
                  const nodeB = NODES[b];
                  const isActive = i === activeConn;
                  return (
                    <line
                      key={i}
                      x1={nodeA.x} y1={nodeA.y}
                      x2={nodeB.x} y2={nodeB.y}
                      stroke={isActive ? "#7c3aed" : "#e2e8f0"}
                      strokeWidth={isActive ? "0.8" : "0.4"}
                      style={{ transition: "stroke 0.4s, stroke-width 0.4s" }}
                    />
                  );
                })}
              </svg>
            )}

            {/* Nodes */}
            {NODES.map((node, i) => {
              const isActive = i === activeNode;
              return (
                <div
                  key={node.id}
                  className="absolute flex flex-col items-center gap-1"
                  style={{
                    left: `${node.x}%`,
                    top: `${node.y}%`,
                    transform: "translate(-50%, -50%)",
                    transition: "transform 0.3s ease",
                    zIndex: isActive ? 20 : 10,
                  }}
                >
                  <div
                    className="rounded-full flex items-center justify-center text-white font-black text-xs shadow-lg transition-all duration-300"
                    style={{
                      width: isActive ? 52 : 40,
                      height: isActive ? 52 : 40,
                      background: node.color,
                      boxShadow: isActive ? `0 0 0 6px ${node.color}30` : "none",
                    }}
                  >
                    {node.flag}
                  </div>
                  <span className="text-[9px] font-black text-slate-600 dark:text-slate-400 bg-white/80 dark:bg-black/70 px-1 rounded">{node.label}</span>

                  {/* Speech bubble when active */}
                  {isActive && (
                    <div
                      className="absolute -top-10 left-1/2 bg-violet-600 text-white text-[9px] font-bold px-2 py-1 rounded-lg whitespace-nowrap shadow-lg"
                      style={{ transform: "translateX(-50%)", animation: "fadeUp 0.3s ease" }}
                    >
                      {phrase.fr.split(" ").slice(0, 3).join(" ")}…
                    </div>
                  )}
                </div>
              );
            })}

            {/* Center score */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center bg-white/90 dark:bg-black/80 rounded-2xl px-4 py-3 border border-slate-200 dark:border-white/10 shadow-xl backdrop-blur-sm">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Collective Mastery</p>
                <p className="text-3xl font-black text-violet-600">{score}<span className="text-base text-slate-400">%</span></p>
                <div className="w-24 h-1.5 bg-slate-100 dark:bg-white/10 rounded-full mx-auto mt-1.5 overflow-hidden">
                  <div className="h-full bg-violet-600 rounded-full transition-all" style={{ width: `${score}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}

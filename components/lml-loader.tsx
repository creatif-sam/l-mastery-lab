"use client";

import { useEffect, useState } from "react";

const NODES = [
  { id: 1, x: 50, y: 15, flag: "🇬🇭", color: "#7c3aed" },
  { id: 2, x: 82, y: 38, flag: "🇲🇦", color: "#0891b2" },
  { id: 3, x: 72, y: 75, flag: "🇫🇷", color: "#059669" },
  { id: 4, x: 28, y: 75, flag: "🇸🇳", color: "#d97706" },
  { id: 5, x: 18, y: 38, flag: "🇹🇷", color: "#dc2626" },
];

const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [0, 2], [1, 3],
];

const PHRASES = [
  "Loading your experience…",
  "Connecting learners…",
  "Building your workspace…",
  "Almost there…",
];

export function LMLLoader() {
  const [activeNode, setActiveNode] = useState(0);
  const [activeConn, setActiveConn] = useState(0);
  const [progress, setProgress] = useState(18);
  const [phrase, setPhrase] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const nodeInt = setInterval(() => setActiveNode((n) => (n + 1) % NODES.length), 900);
    const connInt = setInterval(() => setActiveConn((c) => (c + 1) % CONNECTIONS.length), 600);
    const progInt = setInterval(() => setProgress((p) => (p >= 96 ? 18 : p + 1)), 60);
    const phraseInt = setInterval(() => setPhrase((p) => (p + 1) % PHRASES.length), 2400);
    return () => {
      clearInterval(nodeInt);
      clearInterval(connInt);
      clearInterval(progInt);
      clearInterval(phraseInt);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-black">
      {/* Subtle radial glow matching the hero page */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(139,92,246,0.08),transparent_60%)] pointer-events-none" />

      {/* Network animation */}
      <div className="relative w-[220px] h-[220px] md:w-[260px] md:h-[260px]">
        {/* SVG lines */}
        {mounted && (
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {CONNECTIONS.map(([a, b], i) => {
              const nA = NODES[a];
              const nB = NODES[b];
              const active = i === activeConn;
              return (
                <line
                  key={i}
                  x1={nA.x} y1={nA.y}
                  x2={nB.x} y2={nB.y}
                  stroke={active ? "#7c3aed" : "#e2e8f0"}
                  strokeWidth={active ? "0.9" : "0.4"}
                  style={{ transition: "stroke 0.35s, stroke-width 0.35s" }}
                />
              );
            })}
          </svg>
        )}

        {/* Nodes */}
        {NODES.map((node, i) => {
          const active = i === activeNode;
          return (
            <div
              key={node.id}
              className="absolute flex items-center justify-center"
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                transform: "translate(-50%, -50%)",
                zIndex: active ? 20 : 10,
              }}
            >
              <div
                className="rounded-full flex items-center justify-center text-white font-black text-sm shadow-lg transition-all duration-300"
                style={{
                  width: active ? 48 : 36,
                  height: active ? 48 : 36,
                  background: node.color,
                  boxShadow: active ? `0 0 0 6px ${node.color}28` : "none",
                }}
              >
                {node.flag}
              </div>
            </div>
          );
        })}

        {/* Center score */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center bg-white/90 dark:bg-black/80 rounded-2xl px-4 py-3 border border-slate-200 dark:border-white/10 shadow-xl backdrop-blur-sm">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Loading</p>
            <p className="text-2xl font-black text-violet-600">
              {progress}<span className="text-sm text-slate-400">%</span>
            </p>
            <div className="w-20 h-1.5 bg-slate-100 dark:bg-white/10 rounded-full mx-auto mt-1.5 overflow-hidden">
              <div
                className="h-full bg-violet-600 rounded-full"
                style={{ width: `${progress}%`, transition: "width 60ms linear" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Brand + phrase */}
      <div className="mt-10 flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center font-black text-xs text-white shadow-lg shadow-violet-500/20">
            L
          </div>
          <span className="text-lg font-black tracking-tighter text-slate-900 dark:text-white">
            LML<span className="text-violet-500">.</span>
          </span>
        </div>
        <p
          key={phrase}
          className="text-sm text-slate-500 dark:text-slate-400 font-medium"
          style={{ animation: "lmlFadeUp 0.4s ease" }}
        >
          {PHRASES[phrase]}
        </p>
      </div>

      <style>{`
        @keyframes lmlFadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X, Shield, BarChart2 } from "lucide-react";
import Link from "next/link";

const STORAGE_KEY = "lml_cookie_consent";

type ConsentState = "accepted" | "declined" | null;

const CHIPS = [
  { icon: Shield,    label: "Auth",        desc: "Stay signed in" },
  { icon: BarChart2, label: "Analytics",   desc: "Improve LML" },
  { icon: Cookie,    label: "Preferences", desc: "Your settings" },
];

export function CookieConsent() {
  const [consent, setConsent] = useState<ConsentState | "loading">("loading");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ConsentState | null;
    setConsent(stored);
  }, []);

  const accept = () => { localStorage.setItem(STORAGE_KEY, "accepted"); setConsent("accepted"); };
  const decline = () => { localStorage.setItem(STORAGE_KEY, "declined"); setConsent("declined"); };

  if (consent === "loading" || consent === "accepted" || consent === "declined") return null;

  return (
    <AnimatePresence>
      {/* ── MOBILE: full-width bottom sheet ──────────────────────────── */}
      <motion.div
        key="cookie-mobile"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        className="sm:hidden fixed bottom-0 left-0 right-0 z-[9999]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/10 shadow-[0_-8px_32px_rgba(0,0,0,0.12)] px-4 pt-4 pb-5 rounded-t-2xl">
          {/* Drag handle */}
          <div className="w-10 h-1 bg-slate-200 dark:bg-white/10 rounded-full mx-auto mb-4" />

          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-amber-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Cookie className="w-4 h-4 text-amber-500" />
              </div>
              <p className="font-bold text-slate-900 dark:text-white text-[15px] leading-tight">
                We use cookies
              </p>
            </div>
            <button
              onClick={decline}
              aria-label="Decline"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 active:bg-slate-100 dark:active:bg-white/5 flex-shrink-0 mt-0.5 transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
            Cookies keep you signed in and help us improve your learning experience.
          </p>

          {/* Chips — icon + short label only on mobile */}
          <div className="flex gap-2 mb-4">
            {CHIPS.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-lg px-2.5 py-1.5"
              >
                <Icon size={12} className="text-indigo-500 flex-shrink-0" />
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">{label}</span>
              </div>
            ))}
          </div>

          {/* Buttons — full-width, tall touch targets */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={accept}
              className="h-12 bg-indigo-600 active:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm shadow-indigo-500/25"
            >
              Accept all
            </button>
            <button
              onClick={decline}
              className="h-12 bg-slate-100 dark:bg-white/5 active:bg-slate-200 dark:active:bg-white/10 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl transition-colors border border-slate-200 dark:border-white/10"
            >
              Decline
            </button>
          </div>

          <Link
            href="/learn-more#privacy"
            className="block text-center text-xs text-slate-400 hover:text-indigo-500 transition-colors"
          >
            Privacy policy →
          </Link>
        </div>
      </motion.div>

      {/* ── DESKTOP: floating centred card ───────────────────────────── */}
      <motion.div
        key="cookie-desktop"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        className="hidden sm:block fixed bottom-5 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2.5rem)] max-w-xl"
      >
        <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/40 px-6 py-5">
          <button
            onClick={decline}
            aria-label="Decline cookies"
            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <X size={15} />
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-amber-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Cookie className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm leading-tight">We use cookies</p>
              <p className="text-xs text-slate-500 mt-0.5">Language Mastery Lab</p>
            </div>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
            We use cookies to keep you signed in, remember your preferences, and understand how the
            platform is used so we can improve your learning experience.
          </p>

          <div className="flex flex-wrap gap-2 mb-5">
            {CHIPS.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="flex items-center gap-2 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-lg px-3 py-1.5"
              >
                <Icon size={13} className="text-indigo-500 flex-shrink-0" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{label}</span>
                <span className="text-[11px] text-slate-400">— {desc}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={accept}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-indigo-500/30"
            >
              Accept all cookies
            </button>
            <button
              onClick={decline}
              className="px-5 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 active:scale-95 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-all border border-slate-200 dark:border-white/10"
            >
              Decline
            </button>
            <Link
              href="/learn-more#privacy"
              className="ml-auto text-xs text-slate-400 hover:text-indigo-500 transition-colors"
            >
              Privacy policy
            </Link>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

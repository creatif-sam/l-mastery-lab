"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X, Shield, BarChart2 } from "lucide-react";
import Link from "next/link";

const STORAGE_KEY = "lml_cookie_consent";

type ConsentState = "accepted" | "declined" | null;

export function CookieConsent() {
  const [consent, setConsent] = useState<ConsentState | "loading">("loading");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ConsentState | null;
    setConsent(stored); // null = not yet decided → show banner
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setConsent("accepted");
  };

  const decline = () => {
    localStorage.setItem(STORAGE_KEY, "declined");
    setConsent("declined");
  };

  // Don't render anything until we've read localStorage (avoid SSR flash)
  if (consent === "loading" || consent === "accepted" || consent === "declined") {
    return null;
  }

  // consent === null → user hasn't decided yet
  return (
    <AnimatePresence>
      <motion.div
        key="cookie-banner"
        initial={{ y: 120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 120, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-2xl"
      >
        <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/40 px-5 py-5">
          {/* Close (= decline) */}
          <button
            onClick={decline}
            aria-label="Decline cookies"
            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <X size={15} />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-amber-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Cookie className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm leading-tight">
                We use cookies
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Language Mastery Lab</p>
            </div>
          </div>

          {/* Body */}
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
            We use cookies to keep you signed in, remember your preferences, and understand how the
            platform is used so we can improve your learning experience.
          </p>

          {/* What we use cookies for */}
          <div className="flex flex-wrap gap-2 mb-5">
            {[
              { icon: Shield,    label: "Authentication",   desc: "Stay signed in securely" },
              { icon: BarChart2, label: "Analytics",        desc: "Improve the platform" },
              { icon: Cookie,    label: "Preferences",      desc: "Remember your settings" },
            ].map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="flex items-center gap-2 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-lg px-3 py-1.5"
              >
                <Icon size={13} className="text-indigo-500 flex-shrink-0" />
                <div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{label}</span>
                  <span className="text-[11px] text-slate-400 ml-1 hidden sm:inline">— {desc}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              onClick={accept}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-semibold rounded-xl transition-all duration-150 shadow-sm shadow-indigo-500/30"
            >
              Accept all cookies
            </button>
            <button
              onClick={decline}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 active:scale-95 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-all duration-150 border border-slate-200 dark:border-white/10"
            >
              Decline
            </button>
            <Link
              href="/learn-more#privacy"
              className="text-xs text-slate-400 hover:text-indigo-500 transition-colors sm:ml-2 text-center sm:text-left"
            >
              Privacy policy
            </Link>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

"use client";

import { useState } from "react";
import { AlertTriangle, Mail, X, Building2, ArrowRight } from "lucide-react";
import Link from "next/link";

/**
 * NoOrgModal
 * Shown as a centred modal overlay when a tutor has no organisation assigned.
 * The tutor can dismiss it (to still use their dashboard) but it reappears on
 * every page load until an admin assigns them to an org.
 */
export function NoOrgBanner() {
  const [open, setOpen] = useState(true);
  if (!open) return null;

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      {/* Modal card */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden">

        {/* Amber accent bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 to-orange-400" />

        {/* Close button */}
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
          aria-label="Dismiss – you can still use your dashboard"
        >
          <X size={15} />
        </button>

        <div className="p-8 text-center space-y-5">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center">
              <Building2 size={28} className="text-amber-500" />
            </div>
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">
              No Organisation Assigned
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              You are not yet linked to an organisation. Until an admin assigns
              you, you won&apos;t see students, community posts are restricted,
              and your org logo won&apos;t appear on your dashboard.
            </p>
          </div>

          {/* Steps visual */}
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 text-left space-y-3">
            {[
              { num: "1", text: "Send a message to the platform admin" },
              { num: "2", text: "Ask them to assign you to your organisation" },
              { num: "3", text: "Your students will appear once assigned" },
            ].map((s) => (
              <div key={s.num} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-black flex items-center justify-center flex-shrink-0">
                  {s.num}
                </span>
                <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">{s.text}</p>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col gap-2 pt-1">
            <Link
              href="/protected/tutor/messages"
              onClick={() => setOpen(false)}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-3 rounded-xl transition-colors text-sm shadow-sm shadow-amber-200 dark:shadow-none"
            >
              <Mail size={15} />
              Message Platform Admin
              <ArrowRight size={14} />
            </Link>
            <button
              onClick={() => setOpen(false)}
              className="w-full text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors py-1.5"
            >
              Dismiss and view dashboard anyway
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


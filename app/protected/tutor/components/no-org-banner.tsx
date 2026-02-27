"use client";

import { useState } from "react";
import { AlertTriangle, X, Mail } from "lucide-react";
import Link from "next/link";

export function NoOrgBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="relative bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-2xl p-5 flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-800/50 flex items-center justify-center flex-shrink-0 mt-0.5">
        <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400" />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-amber-800 dark:text-amber-300 text-sm mb-1">
          No Organisation Assigned
        </h3>
        <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
          You are not yet assigned to an organisation. You won't be able to view students or post in the community until an admin assigns you. Please contact the platform admin.
        </p>
        <Link
          href="/protected/tutor/messages"
          className="inline-flex items-center gap-1.5 mt-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          <Mail size={13} /> Message Platform Admin
        </Link>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 transition-colors flex-shrink-0"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
}

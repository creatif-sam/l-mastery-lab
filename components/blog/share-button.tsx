"use client";

import { useState } from "react";
import { Share2, Copy, Check, Twitter, Facebook, Link2 } from "lucide-react";

interface ShareButtonProps {
  title: string;
  url?: string;
}

export function ShareButton({ title, url }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
      } catch {}
    } else {
      setOpen((o) => !o);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

  return (
    <div className="relative">
      <button
        onClick={handleNativeShare}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-violet-400 hover:text-violet-600 transition-all text-sm font-semibold"
      >
        <Share2 size={14} />
        Share
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl p-3 w-52 space-y-1 animate-in fade-in zoom-in-95 duration-150">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 pb-1">Share this post</p>

            <button
              onClick={copyLink}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-slate-400" />}
              {copied ? "Copied!" : "Copy Link"}
            </button>

            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-sky-50 dark:hover:bg-sky-500/10 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-sky-600 transition-colors"
            >
              <Twitter size={14} className="text-sky-400" />
              Post on X
            </a>

            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/10 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors"
            >
              <Facebook size={14} className="text-blue-500" />
              Share on Facebook
            </a>

            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/10 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-700 transition-colors"
            >
              <Link2 size={14} className="text-blue-600" />
              LinkedIn
            </a>
          </div>
        </>
      )}
    </div>
  );
}

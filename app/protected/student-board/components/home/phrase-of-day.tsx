"use client";

import { Quote, Languages, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhraseProps {
  phrase: {
    text: string;
    text_fr: string;
    author: string;
  } | null;
}

export function PhraseCard({ phrase }: PhraseProps) {
  if (!phrase) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5 p-6 shadow-sm relative overflow-hidden group">
      {/* Decorative Background Icon */}
      <Quote className="absolute -right-2 -bottom-2 w-20 h-20 text-slate-50 dark:text-white/[0.02] -rotate-12 transition-transform group-hover:rotate-0 duration-700" />
      
      <div className="relative space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-violet-500/10 rounded-lg">
              <Languages className="w-3.5 h-3.5 text-violet-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                Bilingual Insight
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-md">
            <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
            <span className="text-[9px] font-bold text-amber-600 uppercase">100 Daily Sets</span>
          </div>
        </div>

        {/* Juxtaposed Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start relative">
          {/* Vertical Divider (Desktop Only) */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-slate-100 dark:bg-white/5 -translate-x-1/2" />

          {/* English Block */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-600" />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">English</span>
            </div>
            <p className="text-base font-bold text-slate-900 dark:text-white leading-snug tracking-tight">
              {phrase.text}
            </p>
          </div>

          {/* French Block */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Français</span>
            </div>
            <p className="text-base font-semibold text-slate-500 dark:text-slate-400 leading-snug tracking-tight">
              {phrase.text_fr}
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="pt-2 flex items-center justify-between border-t border-slate-50 dark:border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-4 h-px bg-slate-200 dark:bg-slate-700" />
            <cite className="text-[10px] font-bold text-slate-400 not-italic uppercase tracking-[0.2em]">
              {phrase.author || "Global Repository"}
            </cite>
          </div>
        </footer>
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserCircle, Sparkles, ArrowRight, Globe, Lock, Zap } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { CollaborativeAnimation } from "@/components/collaborative-animation";

export default function HomePage() {
  const [currentLangIndex, setCurrentLangIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const languages = ["French.", "English."];
  const typingSpeed = 120;
  const pauseTime = 2500;

  useEffect(() => {
    const currentFullText = languages[currentLangIndex];
    
    const handleTyping = () => {
      if (!isDeleting) {
        setDisplayText(currentFullText.substring(0, displayText.length + 1));
        if (displayText === currentFullText) {
          setTimeout(() => setIsDeleting(true), pauseTime);
        }
      } else {
        setDisplayText(currentFullText.substring(0, displayText.length - 1));
        if (displayText === "") {
          setIsDeleting(false);
          setCurrentLangIndex((prev) => (prev + 1) % languages.length);
        }
      }
    };

    const timer = setTimeout(handleTyping, isDeleting ? typingSpeed / 2 : typingSpeed);
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, currentLangIndex]);

  return (
    <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white transition-colors duration-300 font-sans antialiased flex flex-col">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.06),transparent_60%)] pointer-events-none" />

      {/* NAV */}
      <nav className="relative z-50 w-full border-b border-slate-200 dark:border-white/5 bg-white/70 dark:bg-black/70 backdrop-blur-xl px-6 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="group flex items-center gap-2">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center font-black text-sm text-white group-hover:rotate-12 transition-transform shadow-lg shadow-violet-500/20">L</div>
            <span className="text-xl font-black tracking-tighter">LML<span className="text-violet-500">.</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <div className="h-6 w-[1px] bg-slate-200 dark:bg-white/10 mx-1" />
            <Link href="/blog" className="text-xs font-black tracking-widest text-slate-500 hover:text-violet-600 dark:hover:text-white uppercase transition-colors px-2 py-1">Blog</Link>
            <div className="h-6 w-[1px] bg-slate-200 dark:bg-white/10 mx-1" />
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-violet-500/10 hover:text-violet-500" asChild>
              <Link href="/auth/login" aria-label="Login"><UserCircle className="w-6 h-6" /></Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* === ANIMATION AT THE TOP === */}
      <CollaborativeAnimation />

      {/* === HERO BELOW === */}
      <main className="relative flex-grow flex flex-col items-center justify-center px-6 py-14 md:py-20">
        <section className="w-full max-w-4xl mx-auto flex flex-col items-center text-center gap-6">

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
            </span>
            <span className="text-violet-600 dark:text-violet-400 font-bold uppercase tracking-[0.2em] text-[10px]">Language Mastery Lab</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tighter">
              Master{" "}
              <span className="text-violet-600 inline-block min-w-[180px] md:min-w-[300px]">
                {displayText}
                <span className="animate-pulse font-thin text-slate-300 dark:text-slate-800">|</span>
              </span>
              <br />
              <span className="italic font-serif font-light text-slate-400 dark:text-slate-600 text-2xl md:text-3xl lg:text-4xl">Own your Future.</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
              The premier ecosystem for <span className="font-bold text-slate-900 dark:text-white">adults and adolescents</span> to accelerate language mastery through <span className="font-bold underline decoration-violet-500/30 underline-offset-4">collective intelligence</span>.
            </p>
          </div>

          <div className="flex flex-col gap-3 items-center w-full max-w-md mt-2">
            <Button asChild size="lg" className="w-full bg-violet-600 hover:bg-violet-700 text-white font-black h-14 px-8 rounded-2xl shadow-2xl shadow-violet-500/30 flex items-center gap-3 text-sm tracking-widest">
              <Link href="/protected/student-board">
                <Sparkles className="w-4 h-4 fill-white" />
                CONTINUE LEARNING
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            <div className="flex gap-3 w-full">
              <Button asChild size="lg" className="bg-slate-900 dark:bg-white text-white dark:text-black font-bold h-12 rounded-2xl flex-1 text-sm">
                <Link href="/auth/sign-up">GET STARTED</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-slate-200 dark:border-white/10 bg-transparent hover:bg-slate-50 dark:hover:bg-white/5 h-12 rounded-2xl font-bold flex-1 text-sm">
                <Link href="/learn-more">GET INSPIRED</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* === SOLID FOOTER === */}
      <footer className="relative z-10 bg-slate-950 text-white mt-auto">
        {/* Main grid */}
        <div className="max-w-7xl mx-auto px-6 pt-14 pb-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-lg shadow-violet-500/30">L</div>
              <span className="text-xl font-black tracking-tighter">LML<span className="text-violet-500">.</span></span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Language Mastery Lab â€” the collective intelligence platform for language learners across Africa and the world.
            </p>
            <div className="flex flex-wrap gap-4 pt-1">
              {[{label:"Blog",href:"/blog"},{label:"Login",href:"/auth/login"},{label:"Sign Up",href:"/auth/sign-up"}].map((l) => (
                <Link key={l.label} href={l.href} className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-violet-400 transition-colors">{l.label}</Link>
              ))}
            </div>
          </div>

          {/* Vision */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-violet-500/10 rounded-lg flex items-center justify-center">
                <Globe className="w-4 h-4 text-violet-400" />
              </div>
              <h4 className="font-black text-sm uppercase tracking-widest">Our Vision</h4>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              A world where language barriers no longer limit human potential. We envision every individual empowered to connect, create, and lead in any language â€” through the transformative power of collective learning.
            </p>
          </div>

          {/* Mission */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-emerald-400" />
              </div>
              <h4 className="font-black text-sm uppercase tracking-widest">Our Mission</h4>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              To accelerate language mastery by combining expert tuition, peer accountability, and intelligent tools within organisations â€” making fluency achievable 5Ã— faster than traditional solo study.
            </p>
          </div>

          {/* Confidentiality */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Lock className="w-4 h-4 text-blue-400" />
              </div>
              <h4 className="font-black text-sm uppercase tracking-widest">Confidentiality</h4>
            </div>
            <ul className="text-slate-400 text-xs leading-relaxed space-y-2">
              <li className="flex gap-2"><span className="text-violet-400 mt-0.5">â€¢</span>Your personal data and learning progress are encrypted and never shared with third parties.</li>
              <li className="flex gap-2"><span className="text-violet-400 mt-0.5">â€¢</span>Organisation data is isolated with Row-Level Security. Zero cross-org data leakage.</li>
              <li className="flex gap-2"><span className="text-violet-400 mt-0.5">â€¢</span>You may request full deletion of your account and data at any time.</li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-slate-600 text-[10px] tracking-[0.2em] uppercase font-bold">
              Â© 2026 LML â€” Language Mastery Lab. All rights reserved.
            </p>
            <div className="flex gap-6 text-[10px] font-black tracking-widest text-slate-600 uppercase">
              <span className="hover:text-violet-400 cursor-pointer transition-colors">Privacy Policy</span>
              <span className="hover:text-violet-400 cursor-pointer transition-colors">Terms of Use</span>
              <Link href="/blog" className="hover:text-violet-400 transition-colors">Blog</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

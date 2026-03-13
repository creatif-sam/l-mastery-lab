"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserCircle, Sparkles, ArrowRight, PlayCircle } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { CollaborativeAnimation } from "@/components/collaborative-animation";
import { FooterSection } from "@/components/footer-section";
import { LanguageSwitcher } from "@/components/language-switcher";

type Lang = "en" | "fr";

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

export default function HomePage() {
  const [siteLang, setSiteLang] = useState<Lang>("en");
  const handleLangChange = useCallback((l: Lang) => setSiteLang(l), []);
  const [onboardingVideoId, setOnboardingVideoId] = useState<string | null>(null);

  const [currentLangIndex, setCurrentLangIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const languages = ["French.", "English."];
  const typingSpeed = 120;
  const pauseTime = 2500;

  // Fetch site config (onboarding video)
  useEffect(() => {
    fetch("/api/site-config")
      .then((r) => r.json())
      .then((cfg) => {
        const id = extractYouTubeId(cfg?.onboarding_video_url ?? "");
        setOnboardingVideoId(id);
      })
      .catch(() => {});
  }, []);

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

      {/* Floating language switcher */}
      <LanguageSwitcher onLanguageChange={handleLangChange} />

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

          {/* === ONBOARDING VIDEO (shown when admin has set a YouTube URL) === */}
          {onboardingVideoId && (
            <div className="w-full max-w-2xl mt-6 space-y-3">
              <div className="flex items-center gap-2 justify-center">
                <PlayCircle className="w-4 h-4 text-violet-500" />
                <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">How to Get Started</span>
              </div>
              <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-xl shadow-violet-500/10 bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${onboardingVideoId}?rel=0&modestbranding=1`}
                  title="How to create an account on LML"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </div>
          )}
        </section>
      </main>

      <FooterSection lang={siteLang} />
    </div>
  );
}

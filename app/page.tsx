"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserCircle } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";

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
      {/* Dynamic Background Glow */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.08),transparent_50%)] dark:bg-[radial-gradient(circle_at_50%_20%,#1e1b4b,transparent_50%)] dark:opacity-20 pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-50 w-full border-b border-slate-200 dark:border-white/5 bg-white/60 dark:bg-black/60 backdrop-blur-xl px-6 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="group flex items-center gap-2">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center font-black text-sm text-white group-hover:rotate-12 transition-transform shadow-lg shadow-violet-500/20">
              L
            </div>
            <span className="text-xl font-black tracking-tighter">
              LML<span className="text-violet-500">.</span>
            </span>
          </Link>
          
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <div className="h-6 w-[1px] bg-slate-200 dark:bg-white/10 mx-1" />
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-violet-500/10 hover:text-violet-500 transition-colors" asChild>
              <Link href="/auth/login" aria-label="Login">
                <UserCircle className="w-6 h-6" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="relative flex-grow flex flex-col items-center justify-start px-6 pt-12 md:pt-20 lg:pt-24">
        
        {/* Hero Section */}
        <section className="w-full max-w-7xl mx-auto flex flex-col items-center text-center gap-6 md:gap-8">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 mb-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
            </span>
            <span className="text-violet-600 dark:text-violet-400 font-bold uppercase tracking-[0.2em] text-[10px]">
              Language Mastery Lab
            </span>
          </div>
          
          {/* Main Headline */}
          <div className="space-y-4 md:space-y-6">
            <h1 className="text-6xl md:text-8xl lg:text-[110px] font-black leading-[0.9] tracking-tighter">
              Master <br />
              <span className="text-violet-600 inline-block min-w-[280px] md:min-w-[450px]">
                {displayText}
                <span className="animate-pulse font-thin text-slate-300 dark:text-slate-800">|</span>
              </span> 
              <br />
              <span className="italic font-serif font-light text-slate-400 dark:text-slate-600">Own your Future.</span>
            </h1>
            
            <p className="text-slate-500 dark:text-slate-400 text-base md:text-xl lg:text-2xl max-w-2xl mx-auto leading-relaxed font-medium">
              The premier ecosystem for <span className="text-slate-900 dark:text-white">adults and adolescents</span> to accelerate language mastery through <span className="text-slate-900 dark:text-white underline decoration-violet-500/30 underline-offset-4 font-bold">collective intelligence</span>.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-xs md:max-w-sm mt-4">
            <Button asChild size="lg" className="bg-violet-600 hover:bg-violet-700 text-white font-bold h-14 md:h-16 px-10 rounded-2xl transition-all shadow-xl shadow-violet-500/20 active:scale-95 flex-1">
              <Link href="/signup">GET STARTED</Link>
            </Button>
            <Button variant="outline" size="lg" className="border-slate-200 dark:border-white/10 bg-transparent hover:bg-slate-50 dark:hover:bg-white/5 h-14 md:h-16 px-10 rounded-2xl font-bold backdrop-blur-sm transition-all flex-1">
              LEARN MORE
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-100 dark:border-white/5 py-8 md:py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 opacity-60">
          <p className="text-slate-500 text-[10px] tracking-[0.2em] uppercase font-bold">
            © 2026 LML — Institutional Lab
          </p>
          <div className="flex gap-10 text-[10px] font-black tracking-widest text-slate-400 uppercase">
            <Link href="#" className="hover:text-violet-600 dark:hover:text-white transition-colors">Twitter</Link>
            <Link href="#" className="hover:text-violet-600 dark:hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
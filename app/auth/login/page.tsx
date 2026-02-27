"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LoginForm } from "@/components/login-form";
import { Globe } from "lucide-react";
import Link from "next/link";

const quotes = [
  "Every language you learn opens a new window to the world.",
  "La maîtrise d'une langue, c'est la maîtrise du monde.",
  "Language is the key that unlocks every door.",
];

export default function Page() {
  const [index, setIndex] = useState(0);
  const [lang, setLang] = useState<"EN" | "FR">("EN");

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % quotes.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] overflow-x-hidden">
      {/* LEFT: LOGIN FORM */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center px-6 sm:px-12 md:px-16 lg:px-20 py-8 lg:py-12 bg-white shadow-2xl z-20 overflow-y-auto">

        {/* Header */}
        <div className="mb-8 md:mb-12 flex items-center justify-between">
          <Link href="/" className="text-2xl font-black tracking-tighter text-[#003366]">
            LML<span className="text-violet-600">.</span>
          </Link>
          <button
            onClick={() => setLang(lang === "EN" ? "FR" : "EN")}
            className="flex items-center gap-2 px-4 py-2 border border-zinc-200 rounded-full text-[10px] font-black text-zinc-600 hover:border-violet-600 hover:text-violet-600 transition-all bg-white shadow-sm active:scale-95"
          >
            <Globe className="w-3 h-3 text-violet-500" />
            <span>{lang === "EN" ? "🇺🇸 ENGLISH" : "🇫🇷 FRANÇAIS"}</span>
          </button>
        </div>

        {/* The Form */}
        <LoginForm />

        {/* Mobile-only Footer */}
        <div className="mt-8 lg:hidden text-center">
          <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
            © 2026 Language Mastery Lab
          </p>
        </div>
      </div>

      {/* RIGHT: DYNAMIC BACKDROP */}
      <div className="hidden lg:flex lg:w-[55%] relative items-center justify-center bg-[#003366] overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 1, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 z-0 opacity-60 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=2073')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#003366] via-[#003366]/60 to-transparent z-10" />

        <div className="relative z-20 px-16 text-center max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8, ease: "circOut" }}
            >
              <p className="text-4xl xl:text-5xl font-serif italic text-white leading-tight drop-shadow-2xl">
                &ldquo;{quotes[index]}&rdquo;
              </p>
              <div className="h-1 w-16 bg-violet-500 mx-auto mt-8 rounded-full shadow-[0_0_15px_rgba(139,92,246,0.6)]" />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Decorative corner element */}
        <div className="absolute bottom-12 right-12 z-20 border-r-2 border-b-2 border-white/20 w-32 h-32" />
      </div>
    </div>
  );
}

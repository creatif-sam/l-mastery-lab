"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SignUpForm } from "@/components/sign-up-form";

const quotes = [
  "Language is the roadmap of a culture.",
  "To have another language is to possess a second soul.",
  "La connaissance est le moteur de l'innovation."
];

export default function SignUpPage() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % quotes.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      {/* LEFT: ENROLLMENT FORM */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center px-8 md:px-16 lg:px-20 py-12 bg-white shadow-xl z-20">
        <div className="mb-10 flex items-center justify-between">
          <span className="text-2xl font-black tracking-tighter text-[#003366]">
            LML<span className="text-violet-600">.</span>
          </span>
          <div className="flex items-center gap-2 px-3 py-1 border border-zinc-200 rounded-full text-[10px] font-bold text-zinc-500">
             <span>🇺🇸 EN</span>
          </div>
        </div>
        <SignUpForm />
      </div>

      {/* RIGHT: DYNAMIC NATURE BACKDROP */}
      <div className="hidden lg:flex lg:w-[55%] relative items-center justify-center bg-[#003366] overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute inset-0 z-0 opacity-80 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1518173946687-a4c8a3b778f9?q=80&w=2070')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#003366]/90 via-[#003366]/40 to-transparent z-10" />
        
        <div className="relative z-20 px-16 text-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 1.2 }}
              className="text-4xl md:text-5xl font-serif italic text-white leading-tight drop-shadow-2xl"
            >
              “{quotes[index]}”
            </motion.p>
          </AnimatePresence>
          <div className="h-1 w-16 bg-violet-500 mx-auto mt-10 rounded-full" />
        </div>
      </div>
    </div>
  );
}
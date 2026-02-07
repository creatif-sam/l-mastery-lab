"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, FlaskConical } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white transition-colors duration-300 font-sans antialiased flex flex-col items-center justify-center relative overflow-hidden px-6">
      
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_50%_50%,#1e1b4b,transparent_50%)] dark:opacity-30 pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center text-center space-y-8 max-w-2xl">
        
        {/* Visual Icon */}
        <div className="relative group">
          <div className="absolute -inset-4 bg-violet-500/20 blur-2xl rounded-full group-hover:bg-violet-500/40 transition-all duration-700" />
          <div className="relative w-24 h-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2rem] flex items-center justify-center shadow-2xl">
            <FlaskConical className="w-12 h-12 text-violet-600 animate-pulse" />
          </div>
        </div>

        {/* Error Text */}
        <div className="space-y-4">
          <h1 className="text-[120px] md:text-[180px] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-slate-900 to-slate-400 dark:from-white dark:to-slate-800">
            404
          </h1>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight mt-[-20px]">
            Lab Module Not Found<span className="text-violet-500">.</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg max-w-md mx-auto leading-relaxed">
            The coordinates you provided do not match any active language labs in our system. You shall profit from it soon.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <Button 
            asChild 
            variant="outline" 
            className="border-slate-200 dark:border-white/10 bg-transparent hover:bg-slate-50 dark:hover:bg-white/5 h-14 rounded-2xl font-bold flex-1 transition-all active:scale-95"
          >
            <button onClick={() => window.history.back()}>
              <ArrowLeft className="mr-2 w-4 h-4" />
              Go Back
            </button>
          </Button>
          
          <Button 
            asChild 
            className="bg-violet-600 hover:bg-violet-700 text-white font-bold h-14 rounded-2xl flex-1 shadow-xl shadow-violet-500/20 transition-all active:scale-95"
          >
            <Link href="/protected/student-board">
              <Home className="mr-2 w-4 h-4" />
              Return Home
            </Link>
          </Button>
        </div>
      </div>

      {/* Subtle Footer Watermark */}
      <div className="absolute bottom-10 opacity-20 flex items-center gap-2">
        <div className="w-6 h-6 bg-violet-600 rounded flex items-center justify-center text-white text-[8px] font-black">L</div>
        <span className="text-[10px] font-bold uppercase tracking-widest">Language Mastery Lab</span>
      </div>
    </div>
  );
}
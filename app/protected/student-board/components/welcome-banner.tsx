// app/(protected)/student-board/_components/welcome-banner.tsx
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WelcomeBanner() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 to-indigo-700 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl shadow-violet-500/20">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full -mr-20 -mt-20 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/20 blur-[60px] rounded-full -ml-10 -mb-10" />
      
      {/* Sparkle Icon patterns */}
      <Sparkles className="absolute top-10 right-12 w-12 h-12 text-white/10 rotate-12" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="max-w-xl space-y-6 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30">
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Online Course</span>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl md:text-5xl font-black leading-[1.1] tracking-tighter">
              Sharpen Your Skills with <br />
              Professional Labs.
            </h2>
            <p className="text-violet-100 text-sm md:text-base font-medium opacity-90 max-w-sm mx-auto md:mx-0">
              Join our active community of adults and adolescents to master languages through shared wisdom.
            </p>
          </div>

          <Button className="bg-white text-violet-700 hover:bg-violet-50 rounded-2xl px-8 h-12 font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 group">
            Join Now 
            <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>

        {/* Visual Element: Matches the "Star" graphic from your reference */}
        <div className="hidden lg:flex items-center justify-center pr-8">
           <div className="relative">
              <div className="absolute inset-0 bg-white blur-3xl opacity-20" />
              <svg 
                width="120" 
                height="120" 
                viewBox="0 0 24 24" 
                fill="none" 
                className="text-white drop-shadow-2xl opacity-90"
              >
                <path 
                  d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" 
                  fill="currentColor" 
                />
              </svg>
           </div>
        </div>
      </div>
    </div>
  );
}
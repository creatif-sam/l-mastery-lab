import { Sidebar } from "../../components/sidebar";
import { Header } from "../../components/header";
import { createClient } from "@/lib/supabase/server";
import { Zap, Activity, BarChart3, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function ResultsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Fetch Dynamic Data from Supabase
  const { data: attempt } = await supabase
    .from("quiz_attempts")
    .select("score, metadata")
    .eq("user_id", user?.id)
    .order("completed_at", { ascending: false })
    .limit(1)
    .single();

  // 2. Dynamic Calculations
  const totalGraded = 14; 
  const rawScore = attempt?.score || 0;
  const successRate = Math.round((rawScore / totalGraded) * 100);
  
  // Custom Dynamic Insights based on Metadata
  const academicBackground = attempt?.metadata?.background || "Standard Intake";

  const results = [
    { 
      label: "Accuracy", 
      value: `${rawScore}/${totalGraded}`, 
      icon: Activity, 
      color: "text-violet-600" 
    },
    { 
      label: "Lab XP", 
      value: `+${rawScore * 50}`, 
      icon: Zap, 
      color: "text-amber-500" 
    },
    { 
      label: "Success Rate", 
      value: `${successRate}%`, 
      icon: BarChart3, 
      color: "text-blue-500" 
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8F9FB] dark:bg-black overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar pb-24 md:pb-12">
          <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-700">
            
            {/* Branded Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-slate-100 dark:border-white/5 pb-8">
              <div className="space-y-2">
                <h1 className="text-5xl font-black italic tracking-tighter text-[#003366] dark:text-white leading-none">
                  INTAKE <span className="text-violet-600">REPORT.</span>
                </h1>
                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em]">Performance Data Analysis</p>
              </div>
              <div className="text-[10px] font-black bg-emerald-500/10 text-emerald-600 px-4 py-2 rounded-full border border-emerald-500/20 uppercase tracking-widest">
                Status: Assessment Completed
              </div>
            </div>

            {/* Dynamic Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {results.map((item) => (
                <div key={item.label} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                  <item.icon className={`w-5 h-5 ${item.color} mb-6`} />
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{item.label}</p>
                  <p className="text-4xl font-black italic mt-1 text-[#003366] dark:text-white">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Personalized Footprint Card */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[3rem] p-10 flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="text-xl font-black italic uppercase tracking-tight">Academic Footprint</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      You identified your foundation as <span className="text-violet-600 font-bold">"{academicBackground}"</span>. 
                      The Lab has synchronized your profile based on this historical data and your current accuracy.
                    </p>
                  </div>
                  <div className="mt-8 pt-8 border-t border-slate-50 dark:border-white/5">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                       <span>Readiness Level</span>
                       <span>{successRate}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-white/5 h-1.5 rounded-full mt-2 overflow-hidden">
                       <div 
                         className="bg-emerald-500 h-full transition-all duration-1000 rounded-full" 
                         style={{ width: `${successRate}%` }}
                       />
                    </div>
                  </div>
               </div>

               {/* Recommendation Card */}
               <div className="bg-[#003366] rounded-[3rem] p-10 text-white flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/20 blur-3xl -mr-10 -mt-10" />
                  <div className="space-y-4 relative z-10">
                    <h3 className="text-xl font-black italic uppercase tracking-tight">Collective Recommendation</h3>
                    <p className="text-blue-100/60 text-sm leading-relaxed">
                      Priority Shift: Based on your performance, we are initiating grammar reconstruction and auditory processing modules for your first sprint.
                    </p>
                  </div>
                  <Link 
                    href="/student-board/lessons" 
                    className="mt-10 inline-flex items-center justify-center gap-3 bg-violet-600 hover:bg-violet-700 text-white h-16 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all shadow-xl active:scale-[0.98]"
                  >
                    Launch First Module
                    <ArrowRight className="w-4 h-4" />
                  </Link>
               </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
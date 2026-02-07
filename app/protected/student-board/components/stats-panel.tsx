// app/(protected)/student-board/_components/stats-panel.tsx
import { MoreVertical, TrendingUp, Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const partners = [
  { name: "Bagas Mahpie", status: "Online", avatar: "BM" },
  { name: "Sir Dandy", status: "In Lab", avatar: "SD" },
  { name: "Jhon Tosan", status: "Offline", avatar: "JT" },
];

export function StatsPanel() {
  return (
    <div className="space-y-8">
      {/* 1. Learning Activity Section */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/5 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-black tracking-tight text-lg">Statistic</h3>
          <Button variant="ghost" size="icon" className="rounded-full">
            <MoreVertical className="w-4 h-4 text-slate-400" />
          </Button>
        </div>

        {/* Circular Progress Area */}
        <div className="relative w-48 h-48 mx-auto mb-6 flex items-center justify-center">
          {/* Background Ring */}
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="80"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="12"
              className="text-slate-100 dark:text-white/5"
            />
            {/* Progress Ring */}
            <circle
              cx="96"
              cy="96"
              r="80"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="12"
              strokeDasharray={502.4}
              strokeDashoffset={502.4 * (1 - 0.72)}
              strokeLinecap="round"
              className="text-violet-600 transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white dark:border-black shadow-xl mb-1">
               {/* Small Avatar icon inside ring */}
               <div className="w-full h-full bg-slate-200 flex items-center justify-center text-xs font-black">YOU</div>
            </div>
            <span className="text-3xl font-black tracking-tighter">72%</span>
          </div>
          <div className="absolute top-0 right-4 bg-violet-600 text-[10px] font-black text-white px-2 py-1 rounded-lg">
            32% ↑
          </div>
        </div>

        <div className="text-center space-y-2">
          <h4 className="font-black text-lg tracking-tight">Focus Mastery 🔥</h4>
          <p className="text-xs text-slate-500 font-bold leading-relaxed">
            Continue your learning to achieve your weekly target!
          </p>
        </div>

        {/* Mini Graph Placeholder (Bar style from reference) */}
        <div className="mt-8 flex items-end justify-between h-20 gap-2">
          {[40, 70, 45, 90, 60].map((height, i) => (
            <div 
              key={i} 
              className="w-full bg-violet-100 dark:bg-violet-900/30 rounded-t-lg transition-all hover:bg-violet-500" 
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
        </div>
      </div>

      {/* 2. Collective Intelligence: Lab Partners */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/5 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-500" />
            <h3 className="font-black tracking-tight text-lg">Lab Partners</h3>
          </div>
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-slate-200 dark:border-white/10">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-6">
          {partners.map((partner) => (
            <div key={partner.name} className="flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-xs font-black group-hover:bg-violet-600 group-hover:text-white transition-all">
                  {partner.avatar}
                </div>
                <div>
                  <p className="text-sm font-black tracking-tight">{partner.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{partner.status}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase text-violet-600 hover:bg-violet-50">
                Follow
              </Button>
            </div>
          ))}
        </div>
        
        <Button className="w-full mt-8 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white border-none rounded-2xl py-6 font-black text-xs uppercase tracking-[0.2em]">
          See All Intelligence
        </Button>
      </div>
    </div>
  );
}
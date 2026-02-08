import { 
  Brain, 
  Users, 
  Globe, 
  GraduationCap, 
  TrendingUp, 
  Languages,
  ArrowRight
} from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";

export default function LearnMorePage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#0F172A] font-sans transition-colors relative">
      
      {/* 🌓 TOP ACTIONS */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeSwitcher />
      </div>

      <main className="max-w-4xl mx-auto p-6 md:p-12 space-y-20 pt-20 pb-32">
        
        {/* 🌍 PART I: THE GENESIS (STORY) */}
        <section className="space-y-10">
          <div className="text-center space-y-4">
            <span className="text-[10px] font-bold text-violet-600 uppercase tracking-[0.3em]">Founding Narrative</span>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">
              From Accra to Fes
            </h1>
          </div>

          <div className="prose dark:prose-invert max-w-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
              <div className="space-y-6 text-sm font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  In <span className="text-violet-600 font-black px-1">January 2020</span>, we left the shores of Ghana with a singular quest: to study in Morocco. We were promised six months of immersion to let the French language settle into our bones.
                </p>
                <p>
                  But history had other plans. Two months in, the world locked down. COVID-19 turned six months of preparation into a frantic sixty days of survival. When the schools finally opened, we weren't ready. I was "predicting" French rather than speaking it—guessing the sounds and hoping for the best.
                </p>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border-l-4 border-violet-600 shadow-sm italic">
                   "That night, I cried like a babe. It felt like I had lost something great—my potential, my voice, and my mission."
                </div>
              </div>

              <div className="space-y-6 text-sm font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  I looked around and saw a tragedy: brilliant students learning in isolation, like islands in a vast, silent ocean. I chose a different path. I turned to my church community.
                </p>
                <p>
                  They became my <span className="text-violet-600 font-black">Collective Intelligence</span>. Every conversation was a laboratory. Every mistake was met with constant, loving feedback. They kept me on my toes. In a span of just 80 days, the equation changed.
                </p>
                <div className="bg-violet-600 text-white p-6 rounded-xl shadow-lg">
                  <h4 className="text-xs font-black uppercase tracking-widest mb-3">The Result:</h4>
                  <ul className="space-y-2 text-xs font-bold">
                    <li className="flex items-center gap-2"><TrendingUp className="w-3 h-3" /> Top Student of the Class</li>
                    <li className="flex items-center gap-2"><TrendingUp className="w-3 h-3" /> Top Student of the Department</li>
                    <li className="flex items-center gap-2"><TrendingUp className="w-3 h-3" /> Highest GPA in the School</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="mt-12 p-8 bg-slate-100 dark:bg-white/5 rounded-2xl text-center">
               <p className="text-base font-bold text-slate-900 dark:text-white">
                 Today, I stand before 400 people every trimester,sharing the Word of God into the very language that once made me cry.
               </p>
            </div>
          </div>
        </section>

        <hr className="border-slate-200 dark:border-white/5" />

        {/* 🧬 PART II: THE SCIENCE (COLLECTIVE INTELLIGENCE) */}
        <section className="space-y-12">
          <div className="text-center space-y-4">
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.3em]">Theoretical Framework</span>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">
              Why it Works: Collective Intelligence
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TheoryCard 
              icon={Users} 
              title="Malone's Genome" 
              desc="Thomas Malone (MIT) defines CI as groups acting intelligently. Our 'How' is juxtaposed collaboration that ensures higher retention."
            />
            <TheoryCard 
              icon={Brain} 
              title="Pierre Lévy's Vision" 
              desc="'No one knows everything, everyone knows something.' Our lab replaces textbooks with a collective social brain."
            />
            <TheoryCard 
              icon={Languages} 
              title="Vygotsky's ZPD" 
              desc="The Bedrock: Students learn best through social interaction with a 'More Knowledgeable Other' like our community."
            />
          </div>

          {/* COMPARISON TABLE */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-white/5">
                  <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Feature</th>
                  <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Isolated Study</th>
                  <th className="p-4 text-[10px] font-black uppercase text-violet-600 tracking-widest">Mastery Lab (CI)</th>
                </tr>
              </thead>
              <tbody className="text-xs font-bold divide-y divide-slate-100 dark:divide-white/5">
                <tr>
                  <td className="p-4 text-slate-900 dark:text-white">Feedback Loop</td>
                  <td className="p-4 text-slate-400">Delayed (Teacher only)</td>
                  <td className="p-4 text-violet-600">Instant (Peer & System)</td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-900 dark:text-white">Context</td>
                  <td className="p-4 text-slate-400">Artificial / Dry</td>
                  <td className="p-4 text-violet-600">Dynamic (Social)</td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-900 dark:text-white">Error Correction</td>
                  <td className="p-4 text-slate-400">Punitive</td>
                  <td className="p-4 text-violet-600">Collaborative "Happy Accidents"</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 🚀 CALL TO ACTION BUTTON */}
        <div className="flex flex-col items-center space-y-6 pt-10">
          <Link 
            href="/protected/student-board" 
            className="group flex items-center gap-3 bg-violet-600 hover:bg-violet-700 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-violet-500/20 active:scale-95"
          >
            Start Your Mastery Quest
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Join the lab today • No more learning in isolation
          </p>
        </div>

      </main>
    </div>
  );
}

function TheoryCard({ icon: Icon, title, desc }: any) {
  return (
    <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl shadow-sm space-y-4 hover:border-violet-500/50 transition-colors group">
      <div className="w-10 h-10 bg-violet-500/10 rounded-lg flex items-center justify-center text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-all">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="font-black text-slate-900 dark:text-white uppercase text-[10px] tracking-widest">{title}</h3>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}
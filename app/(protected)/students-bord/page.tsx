// app/(protected)/students-bord/page.tsx
import { Sidebar } from "./components/sidebar";
import { WelcomeBanner } from "./components/welcome-banner";
import { ProgressGrid } from "./components/progress-grid";
import { LessonCarousel } from "./components/lesson-carousel";
import { StatsPanel } from "./components/stats-panel";

export default function StudentBoard() {
  return (
    <div className="flex min-h-screen bg-[#F8F9FB] dark:bg-black transition-colors">
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navigation / Search Bar */}
        <header className="px-8 py-4 flex justify-between items-center bg-white/50 dark:bg-black/50 backdrop-blur-md border-b border-slate-200 dark:border-white/5">
          <div className="relative w-96">
            <input 
              type="text" 
              placeholder="Search your course..." 
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
          <div className="flex items-center gap-4">
            {/* Icons for notifications/messages would go here */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">Student Name</span>
              <div className="w-8 h-8 rounded-full bg-slate-200" />
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-8">
            
            {/* Main Column */}
            <div className="flex-1 space-y-10">
              <WelcomeBanner />
              
              <section className="space-y-4">
                <h3 className="text-lg font-black tracking-tight text-slate-800 dark:text-slate-200">ACTIVE LABS</h3>
                <ProgressGrid />
              </section>

              <section className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-black tracking-tight text-slate-800 dark:text-slate-200">CONTINUE LEARNING</h3>
                  <button className="text-violet-600 text-xs font-bold hover:underline">See all</button>
                </div>
                <LessonCarousel />
              </section>
            </div>

            {/* Stats Sidebar */}
            <aside className="w-full lg:w-80 space-y-8">
              <StatsPanel />
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
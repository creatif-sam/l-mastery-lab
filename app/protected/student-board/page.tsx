// app/(protected)/students-bord/page.tsx
import { Sidebar } from "./components/sidebar";
import { Header } from "./components/header"; // Modularized Header
import { WelcomeBanner } from "./components/welcome-banner";
import { ProgressGrid } from "./components/progress-grid";
import { LessonCarousel } from "./components/lesson-carousel";
import { StatsPanel } from "./components/stats-panel";

export default function StudentBoard() {
  return (
    <div className="flex min-h-screen bg-[#F8F9FB] dark:bg-black transition-colors">
      {/* Permanent Sidebar */}
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Modular Top Navigation with Search & Theme Switcher */}
        <Header />

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-8">
            
            {/* Main Column: Learning Content */}
            <div className="flex-1 space-y-10">
              <WelcomeBanner />
              
              <section className="space-y-4">
                <h3 className="text-lg font-black tracking-tight text-slate-800 dark:text-slate-200 uppercase">
                  Active Labs
                </h3>
                <ProgressGrid />
              </section>

              <section className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-black tracking-tight text-slate-800 dark:text-slate-200 uppercase">
                    Continue Learning
                  </h3>
                  <button className="text-violet-600 text-xs font-bold hover:underline uppercase tracking-widest">
                    See all
                  </button>
                </div>
                <LessonCarousel />
              </section>
            </div>

            {/* Right Sidebar: Activity & Partners */}
            <aside className="w-full lg:w-80 space-y-8">
              <StatsPanel />
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
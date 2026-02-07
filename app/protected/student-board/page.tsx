import { Sidebar } from "./components/sidebar";
import { Header } from "./components/header";
import { ActiveQuiz } from "./components/quiz/active-quiz";

// Dummy data for initial build - later you will fetch this from Supabase
const MOCK_QUESTIONS = [
  {
    id: "1",
    question_text: "Comment dit-on 'Collective Intelligence' en français?",
    options: [
      { id: "a", option_text: "Intelligence Artificielle", is_correct: false },
      { id: "b", option_text: "Intelligence Collective", is_correct: true },
      { id: "c", option_text: "Sagesse de Groupe", is_correct: false },
      { id: "d", option_text: "Esprit d'équipe", is_correct: false },
    ],
  },
  {
    id: "2",
    question_text: "Which tense is used for an action happening right now in English?",
    options: [
      { id: "a", option_text: "Past Simple", is_correct: false },
      { id: "b", option_text: "Present Continuous", is_correct: true },
      { id: "c", option_text: "Future Perfect", is_correct: false },
      { id: "d", option_text: "Present Simple", is_correct: false },
    ],
  },
];

// MUST be 'export default' to fix your Vercel Build Error
export default function QuizPage() {
  return (
    <div className="flex min-h-screen bg-[#F8F9FB] dark:bg-black transition-colors overflow-hidden">
      {/* Sidebar - Desktop and Mobile (Bottom Bar) */}
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header with Dynamic Profile & Theme Switcher */}
        <Header />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar pb-24 md:pb-10">
          <div className="max-w-4xl mx-auto space-y-10">
            
            {/* Page Title Section */}
            <div className="text-center md:text-left space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 text-[10px] font-black uppercase tracking-widest">
                Lab Assessment v1.0
              </div>
              <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-slate-900 dark:text-white">
                QUIZ <span className="text-violet-600">ARENA.</span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                Test your mastery of French and English through our collective intelligence modules.
              </p>
            </div>

            {/* The Actual Quiz Component */}
            <ActiveQuiz questions={MOCK_QUESTIONS} />
            
          </div>
        </main>
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronRight, Timer, RotateCcw } from "lucide-react";

export function ActiveQuiz({ questions }: { questions: any[] }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  const handleNext = () => {
    const isCorrect = currentQuestion.options.find(
      (o: any) => o.id === selectedOption
    )?.is_correct;

    if (isCorrect) setScore(score + 1);

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
      setSelectedOption(null);
    } else {
      setIsFinished(true);
    }
  };

  const resetQuiz = () => {
    setCurrentStep(0);
    setSelectedOption(null);
    setScore(0);
    setIsFinished(false);
  };

  if (isFinished) {
    return (
      <div className="text-center p-12 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-xl space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-500/5">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-4xl font-black italic tracking-tighter">LAB COMPLETE!</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
            Collective Intelligence Score
          </p>
          <div className="text-5xl font-black text-violet-600 mt-4">
            {score} <span className="text-slate-300 dark:text-slate-700 text-2xl">/ {questions.length}</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button onClick={resetQuiz} variant="outline" className="rounded-2xl h-14 px-8 border-slate-200 font-bold">
            <RotateCcw className="mr-2 w-4 h-4" /> Try Again
          </Button>
          <Button className="bg-violet-600 rounded-2xl h-14 px-8 font-black uppercase tracking-widest shadow-lg shadow-violet-500/20">
            Sync to Arena
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Info */}
      <div className="flex justify-between items-end px-2">
        <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Assessment</p>
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black">
                <Timer className="w-4 h-4 text-violet-500" />
                <span>Question {currentStep + 1} of {questions.length}</span>
            </div>
        </div>
        <span className="text-violet-600 font-black text-xl tracking-tighter">{Math.round(progress)}%</span>
      </div>

      {/* Modern Progress Bar */}
      <div className="h-3 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden p-1 border border-white dark:border-white/5">
        <div 
            className="h-full bg-violet-600 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(139,92,246,0.5)]"
            style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-8 md:p-14 rounded-[3rem] shadow-2xl shadow-slate-200/50 dark:shadow-none space-y-12">
        <h3 className="text-2xl md:text-4xl font-black leading-[1.1] tracking-tight text-center md:text-left">
          {currentQuestion.question_text}
        </h3>

        <div className="grid gap-4">
          {currentQuestion.options.map((option: any) => (
            <button
              key={option.id}
              onClick={() => setSelectedOption(option.id)}
              className={`group flex items-center justify-between p-6 rounded-[1.5rem] border-2 transition-all font-bold text-left ${
                selectedOption === option.id
                  ? "border-violet-600 bg-violet-600/5 text-violet-600"
                  : "border-slate-50 dark:border-white/5 hover:border-slate-200 dark:hover:bg-white/[0.02]"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black border-2 ${
                    selectedOption === option.id ? "bg-violet-600 text-white border-violet-600" : "bg-slate-100 dark:bg-white/5 border-transparent text-slate-400"
                }`}>
                    {option.id.toUpperCase()}
                </div>
                <span className="text-lg">{option.option_text}</span>
              </div>
              {selectedOption === option.id && <CheckCircle2 className="w-6 h-6 animate-in zoom-in" />}
            </button>
          ))}
        </div>

        <Button 
          disabled={!selectedOption}
          onClick={handleNext}
          className="w-full h-16 md:h-20 bg-violet-600 hover:bg-violet-700 text-white rounded-[1.5rem] font-black text-xl shadow-2xl shadow-violet-500/30 disabled:opacity-30 disabled:grayscale transition-all active:scale-[0.98]"
        >
          {currentStep === questions.length - 1 ? "FINISH LAB" : "NEXT QUESTION"}
          <ChevronRight className="ml-2 w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}
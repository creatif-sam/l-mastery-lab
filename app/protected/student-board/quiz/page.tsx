"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, ChevronRight, Timer } from "lucide-react";

export function ActiveQuiz({ questions }: { questions: any[] }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  const handleNext = () => {
    // Check if correct
    if (currentQuestion.options.find((o: any) => o.id === selectedOption)?.is_correct) {
      setScore(score + 1);
    }

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
      setSelectedOption(null);
    } else {
      setIsFinished(true);
    }
  };

  if (isFinished) {
    return (
      <div className="text-center p-12 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 space-y-6">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-3xl font-black italic">Lab Complete!</h2>
        <p className="text-slate-500">You scored {score} out of {questions.length}</p>
        <Button className="bg-violet-600 rounded-xl px-10">Back to Arena</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header Info */}
      <div className="flex justify-between items-center px-2">
        <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-widest">
          <Timer className="w-4 h-4" />
          <span>Question {currentStep + 1} of {questions.length}</span>
        </div>
        <span className="text-violet-600 font-black text-sm">{Math.round(progress)}%</span>
      </div>

      <Progress value={progress} className="h-2 bg-slate-100 dark:bg-white/5" />

      {/* Question Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none space-y-10">
        <h3 className="text-2xl md:text-3xl font-black leading-tight tracking-tight">
          {currentQuestion.question_text}
        </h3>

        <div className="grid gap-4">
          {currentQuestion.options.map((option: any) => (
            <button
              key={option.id}
              onClick={() => setSelectedOption(option.id)}
              className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all font-bold text-left ${
                selectedOption === option.id
                  ? "border-violet-600 bg-violet-600/5 text-violet-600 shadow-lg shadow-violet-500/10"
                  : "border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10"
              }`}
            >
              <span>{option.option_text}</span>
              {selectedOption === option.id && <CheckCircle2 className="w-5 h-5" />}
            </button>
          ))}
        </div>

        <Button 
          disabled={!selectedOption}
          onClick={handleNext}
          className="w-full h-16 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-violet-500/20 disabled:opacity-50"
        >
          {currentStep === questions.length - 1 ? "Finish Lab" : "Next Question"}
          <ChevronRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
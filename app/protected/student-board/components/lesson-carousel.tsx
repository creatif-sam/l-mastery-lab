// app/(protected)/student-board/_components/lesson-carousel.tsx

import { Heart, PlayCircle, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress"; 

const lessons = [
  {
    id: 1,
    title: "Mastering French Verb Conjugation",
    category: "French Syntax",
    instructor: "Jean-Luc Picard",
    progress: 65,
    image: "https://images.unsplash.com/photo-1503917988258-f87a78e3c995?auto=format&fit=crop&w=800&q=80",
    duration: "45 min",
  },
  // ... other lessons
];

// CRITICAL: Ensure this "export" keyword is present!
export function LessonCarousel() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {lessons.map((lesson) => (
        <div 
          key={lesson.id} 
          className="group bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
        >
          {/* Component Content */}
          <div className="relative aspect-video overflow-hidden">
            <img 
              src={lesson.image} 
              alt={lesson.title}
              className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
            />
          </div>
          <div className="p-6">
             <h4 className="font-black text-base">{lesson.title}</h4>
             <Progress value={lesson.progress} className="mt-4 h-1.5" />
          </div>
        </div>
      ))}
    </div>
  );
}
// app/(protected)/students-bord/_components/progress-grid.tsx
const labs = [
  { title: "English Syntax", count: "4/12 labs", color: "bg-blue-500" },
  { title: "French Oral", count: "8/10 labs", color: "bg-violet-500" },
  { title: "Vocabulary Lab", count: "1/5 labs", color: "bg-emerald-500" },
];

export function ProgressGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {labs.map((lab) => (
        <div key={lab.title} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-white/5 flex items-center justify-between group cursor-pointer hover:border-violet-500/30 transition-all">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${lab.color} opacity-10 flex items-center justify-center`} />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{lab.count} completed</p>
              <h4 className="text-sm font-black">{lab.title}</h4>
            </div>
          </div>
          <div className="text-slate-300 group-hover:text-violet-500">→</div>
        </div>
      ))}
    </div>
  );
}
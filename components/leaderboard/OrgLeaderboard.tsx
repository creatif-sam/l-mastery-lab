// components/leaderboard/OrgLeaderboard.tsx

const organizations = [
  { name: "Sorbonne Research Lab", xp: 125400, rank: 1, logo: "🎓" },
  { name: "Lycée Excellence", xp: 98200, rank: 2, logo: "🏫" },
  { name: "Global Collective AI", xp: 87100, rank: 3, logo: "🧠" },
];

export function OrgLeaderboard() {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
      <div className="space-y-4">
        {organizations.map((org) => (
          <div 
            key={org.name} 
            className="flex items-center justify-between p-4 bg-black/40 border border-slate-800/50 rounded-2xl hover:border-violet-500/50 transition-all group"
          >
            <div className="flex items-center gap-4">
              <span className="text-xl font-black text-slate-600 group-hover:text-violet-500 transition-colors w-6">
                {org.rank}
              </span>
              <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-xl shadow-inner">
                {org.logo}
              </div>
              <div>
                <p className="font-bold text-slate-200">{org.name}</p>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Institution</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-black text-violet-400">{org.xp.toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 font-bold">TOTAL XP</p>
            </div>
          </div>
        ))}
      </div>
      
      <button className="w-full mt-6 py-3 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-violet-400 transition-colors border-t border-slate-800 pt-4">
        View Full Leaderboard →
      </button>
    </div>
  );
}
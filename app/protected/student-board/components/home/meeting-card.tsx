"use client";

import { Calendar as CalendarIcon, Clock, Video, ExternalLink, MoreVertical } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Meeting {
  title: string;
  platform: string;
  meeting_link: string;
  start_time: string;
}

export function MeetingCard({ meeting }: { meeting: Meeting | null }) {
  const hasMeeting = !!meeting;
  const date = hasMeeting ? new Date(meeting.start_time) : new Date();

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-violet-600" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">
            Formation Briefing
          </h3>
        </div>
        <button className="text-slate-400 hover:text-slate-600 transition-colors">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm flex flex-col md:flex-row">
        {/* Date Accent Block */}
        <div className={cn(
          "p-6 flex flex-col items-center justify-center text-white min-w-[120px] transition-colors",
          hasMeeting ? "bg-violet-600" : "bg-slate-300 dark:bg-slate-800"
        )}>
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
            {hasMeeting ? format(date, "MMM") : "---"}
          </span>
          <span className="text-3xl font-bold leading-none my-1">
            {hasMeeting ? format(date, "dd") : "00"}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
            {hasMeeting ? format(date, "eee") : "Empty"}
          </span>
        </div>

        {/* Meeting Details */}
        <div className="flex-1 p-5 flex flex-col justify-center">
          {hasMeeting ? (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  {meeting.title}
                </h4>
                <div className="flex items-center gap-4 text-slate-500 text-[11px]">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    {format(date, "p")}
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-violet-600 dark:text-violet-400 uppercase">
                    <Video className="w-3.5 h-3.5" />
                    {meeting.platform}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={meeting.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2 shadow-sm"
                >
                  Join Room
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ) : (
            <div className="py-2">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                No sessions scheduled
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Sync with your formation to set a meeting time.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
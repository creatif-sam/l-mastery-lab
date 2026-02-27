"use client";

import { useState, useRef, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  getDay,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Video,
  ExternalLink,
  Clock,
  X,
  Calendar,
} from "lucide-react";

interface Meeting {
  id: string;
  title: string;
  platform: string;
  meeting_link: string;
  start_time: string;
}

interface MeetingCalendarProps {
  meetings: Meeting[];
}

export function MeetingCalendar({ meetings }: MeetingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [popupPos, setPopupPos] = useState<{ top: number; left: number } | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const getMeetingsOnDay = (day: Date): Meeting[] =>
    meetings.filter((m) => isSameDay(new Date(m.start_time), day));

  const detectPlatformColor = (platform: string) => {
    if (platform === "Google Meet") return "emerald";
    if (platform === "Zoom") return "blue";
    return "violet";
  };

  const platformIcon = (link: string) => {
    if (link.includes("meet.google.com")) return "🟢";
    if (link.includes("zoom.us")) return "🔵";
    return "📹";
  };

  // Build calendar grid (6 rows with possible leading/trailing days)
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Mon
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Close popup when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setSelectedDay(null);
        setPopupPos(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleDayClick = (day: Date, e: React.MouseEvent<HTMLButtonElement>) => {
    const dayMeetings = getMeetingsOnDay(day);
    if (dayMeetings.length === 0) {
      setSelectedDay(null);
      setPopupPos(null);
      return;
    }

    if (selectedDay && isSameDay(selectedDay, day)) {
      setSelectedDay(null);
      setPopupPos(null);
      return;
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const calRect = calendarRef.current?.getBoundingClientRect();
    if (calRect) {
      setPopupPos({
        top: rect.bottom - calRect.top + 8,
        left: Math.min(rect.left - calRect.left, calRect.width - 260),
      });
    }
    setSelectedDay(day);
  };

  const selectedMeetings = selectedDay ? getMeetingsOnDay(selectedDay) : [];

  return (
    <div ref={calendarRef} className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 p-5 shadow-sm">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-violet-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">
            Class Calendar
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setCurrentMonth(subMonths(currentMonth, 1)); setSelectedDay(null); }}
            className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-sm font-bold text-slate-900 dark:text-white px-2 min-w-[110px] text-center">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <button
            onClick={() => { setCurrentMonth(addMonths(currentMonth, 1)); setSelectedDay(null); }}
            className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* ── Weekday labels ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-7 mb-2">
        {WEEK_DAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider py-1">
            {d}
          </div>
        ))}
      </div>

      {/* ── Day grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
          const dayMeetings = getMeetingsOnDay(day);
          const hasMeeting = dayMeetings.length > 0;
          const inMonth = isSameMonth(day, currentMonth);
          const today = isToday(day);
          const selected = selectedDay ? isSameDay(day, selectedDay) : false;

          return (
            <button
              key={day.toISOString()}
              onClick={(e) => handleDayClick(day, e)}
              className={`
                relative flex flex-col items-center justify-center rounded-xl aspect-square text-xs font-semibold transition-all
                ${!inMonth ? "opacity-30" : ""}
                ${hasMeeting && inMonth
                  ? selected
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-500/30 scale-105"
                    : "bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 dark:from-violet-500/30 dark:to-fuchsia-500/30 text-violet-700 dark:text-violet-300 hover:scale-105 hover:shadow-md cursor-pointer border border-violet-300/60 dark:border-violet-500/30"
                  : today
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                }
              `}
            >
              <span className="leading-none">{format(day, "d")}</span>
              {hasMeeting && inMonth && !selected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {dayMeetings.slice(0, 3).map((_, i) => (
                    <span
                      key={i}
                      className="w-1 h-1 rounded-full bg-violet-500 dark:bg-violet-400"
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Legend ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 border border-violet-300/60 flex-shrink-0" />
          <span className="text-[10px] text-slate-400 font-medium">Meeting day</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-slate-900 dark:bg-white flex-shrink-0" />
          <span className="text-[10px] text-slate-400 font-medium">Today</span>
        </div>
        {meetings.length === 0 && (
          <span className="ml-auto text-[10px] text-slate-400 italic">No sessions this month</span>
        )}
      </div>

      {/* ── Meeting Popup ───────────────────────────────────────────────────── */}
      {selectedDay && selectedMeetings.length > 0 && popupPos && (
        <div
          className="absolute z-50 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          style={{ top: popupPos.top, left: Math.max(0, popupPos.left) }}
        >
          {/* Popup header */}
          <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">
                {format(selectedDay, "EEEE, dd MMM")}
              </p>
              <p className="text-xs font-bold text-white mt-0.5">
                {selectedMeetings.length} session{selectedMeetings.length > 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={() => { setSelectedDay(null); setPopupPos(null); }}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Meeting list */}
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {selectedMeetings.map((m) => (
              <div key={m.id} className="p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                    {platformIcon(m.meeting_link)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      {m.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <Clock size={9} />
                      <span>{format(new Date(m.start_time), "p")}</span>
                      <span className="font-bold text-violet-500 dark:text-violet-400">{m.platform}</span>
                    </div>
                  </div>
                </div>
                <a
                  href={m.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-bold tracking-wide transition-colors shadow-sm"
                >
                  <Video size={12} />
                  Join {m.platform}
                  <ExternalLink size={10} className="opacity-70" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

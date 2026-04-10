"use client";

import { useState, useEffect } from "react";
import { Zap, CheckCircle2, Flame, Clock } from "lucide-react";
import GlassCard from "./GlassCard";

interface TodoItem { id: string; text: string; done: boolean; }
interface Habit { id: string; name: string; color: string; completedDates: string[]; }

function getMotivation(rate: number): string {
  if (rate >= 100) return "Fantastiskt! Allt klart idag!";
  if (rate >= 75) return "Imponerande, snart i mål!";
  if (rate >= 50) return "Halvvägs, fortsätt så!";
  if (rate >= 25) return "Bra start!";
  return "En ny dag, nya möjligheter!";
}

export default function DailySummary() {
  const [mounted, setMounted] = useState(false);
  const [todosDone, setTodosDone] = useState(0);
  const [todosTotal, setTodosTotal] = useState(0);
  const [habitsDone, setHabitsDone] = useState(0);
  const [habitsTotal, setHabitsTotal] = useState(0);
  const [pomodoroCount, setPomodoroCount] = useState(0);

  useEffect(() => {
    setMounted(true);
    const today = new Date().toISOString().split("T")[0];
    try { const t: TodoItem[] = JSON.parse(localStorage.getItem("dashboard-todos") || "[]"); setTodosTotal(t.length); setTodosDone(t.filter((x) => x.done).length); } catch {}
    try { const h: Habit[] = JSON.parse(localStorage.getItem("dashboard-habits") || "[]"); setHabitsTotal(h.length); setHabitsDone(h.filter((x) => x.completedDates.includes(today)).length); } catch {}
    try { setPomodoroCount(parseInt(localStorage.getItem("pomodoro-count") || "0", 10)); } catch {}
  }, []);

  if (!mounted) return <GlassCard className="flex items-center justify-center"><div className="h-16 w-16 rounded-full bg-surface animate-pulse" /></GlassCard>;

  const focusHours = Math.round((pomodoroCount * 25) / 60 * 10) / 10;
  const todoRate = todosTotal > 0 ? todosDone / todosTotal : 0;
  const habitRate = habitsTotal > 0 ? habitsDone / habitsTotal : 0;
  const sources = (todosTotal > 0 ? 1 : 0) + (habitsTotal > 0 ? 1 : 0);
  const overallRate = sources > 0 ? ((todoRate + habitRate) / sources) * 100 : 0;
  const circ = 2 * Math.PI * 40;

  return (
    <GlassCard className="flex flex-col" hover3d={false}>
      <p className="text-xs font-medium text-fg-secondary uppercase tracking-wider mb-2">Sammanfattning</p>

      <div className="flex items-center gap-3 mb-3">
        <div className="relative w-16 h-16 shrink-0">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="var(--separator)" strokeWidth="4" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round"
              strokeDasharray={`${circ}`} strokeDashoffset={`${circ * (1 - overallRate / 100)}`}
              className="transition-all duration-700" style={{ filter: "drop-shadow(0 0 4px rgba(46,148,190,0.3))" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-base font-bold text-foreground">{Math.round(overallRate)}%</span>
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-foreground leading-snug">{getMotivation(overallRate)}</p>
          <p className="text-[10px] text-fg-tertiary mt-0.5">{focusHours > 0 ? `${focusHours}h fokustid` : "Starta en pomodoro"}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5 mt-auto">
        {[
          { label: "Uppgifter", value: `${todosDone}/${todosTotal}`, icon: CheckCircle2, color: "var(--accent)" },
          { label: "Vanor", value: `${habitsDone}/${habitsTotal}`, icon: Flame, color: "#69db7c" },
          { label: "Pomodoros", value: `${pomodoroCount}`, icon: Zap, color: "#da77f2" },
          { label: "Fokustid", value: `${focusHours}h`, icon: Clock, color: "#ffa94d" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-surface/50">
            <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: `${s.color}18` }}>
              <s.icon size={11} style={{ color: s.color }} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground leading-tight">{s.value}</p>
              <p className="text-[9px] text-fg-tertiary">{s.label}</p>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

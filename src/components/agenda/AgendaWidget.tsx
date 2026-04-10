"use client";

import { useState, useEffect } from "react";
import GlassCard from "../GlassCard";

interface Reminder { id: string; title: string; date: string; time?: string; color?: string }
interface Todo { id: string; title: string; dueDate?: string; completed?: boolean }
interface AgendaEntry { id: string; title: string; time: string; color: string; type: "reminder" | "todo" }

function getNext7Days(): { key: string; label: string; isToday: boolean }[] {
  const days: { key: string; label: string; isToday: boolean }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split("T")[0];
    const label = i === 0 ? "Idag" : i === 1 ? "Imorgon" : d.toLocaleDateString("sv-SE", { weekday: "short", day: "numeric" });
    days.push({ key, label, isToday: i === 0 });
  }
  return days;
}

function currentTimePercent(): number {
  const now = new Date();
  return (now.getHours() * 60 + now.getMinutes()) / (24 * 60) * 100;
}

export default function AgendaWidget() {
  const [mounted, setMounted] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [, setTick] = useState(0);

  useEffect(() => {
    setMounted(true);
    try { const r = localStorage.getItem("dashboard-reminders"); if (r) setReminders(JSON.parse(r)); } catch {}
    try { const t = localStorage.getItem("dashboard-todos"); if (t) setTodos(JSON.parse(t)); } catch {}
    const i = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(i);
  }, []);

  if (!mounted) return <GlassCard className="flex items-center justify-center"><div className="h-6 w-24 rounded bg-separator animate-pulse" /></GlassCard>;

  const days = getNext7Days();
  const todayKey = days[0].key;

  const agendaByDay: Record<string, AgendaEntry[]> = {};
  for (const day of days) agendaByDay[day.key] = [];

  for (const r of reminders) {
    const dk = r.date?.split("T")[0];
    if (dk && agendaByDay[dk]) {
      agendaByDay[dk].push({ id: r.id, title: r.title, time: r.time || r.date?.split("T")[1]?.slice(0, 5) || "", color: r.color || "var(--accent)", type: "reminder" });
    }
  }
  for (const t of todos) {
    if (t.completed) continue;
    const dk = t.dueDate?.split("T")[0];
    if (dk && agendaByDay[dk]) {
      agendaByDay[dk].push({ id: t.id, title: t.title, time: t.dueDate?.split("T")[1]?.slice(0, 5) || "", color: "#69db7c", type: "todo" });
    }
  }

  for (const k of Object.keys(agendaByDay)) {
    agendaByDay[k].sort((a, b) => a.time.localeCompare(b.time));
  }

  const hasAny = Object.values(agendaByDay).some(e => e.length > 0);

  return (
    <GlassCard className="flex flex-col h-[280px]">
      <p className="text-xs font-medium text-fg-secondary uppercase tracking-wider mb-2">Veckoagenda</p>
      <div className="flex-1 overflow-y-auto -mr-1 pr-1 space-y-1.5">
        {!hasAny && (
          <p className="text-xs text-fg-tertiary text-center mt-8">Inga händelser denna vecka</p>
        )}
        {days.map(day => {
          const entries = agendaByDay[day.key];
          if (entries.length === 0 && day.key !== todayKey) return null;
          return (
            <div key={day.key}>
              <div className={`flex items-center gap-1.5 mb-0.5 ${day.isToday ? "text-accent" : "text-fg-tertiary"}`}>
                <span className="text-[10px] font-semibold uppercase">{day.label}</span>
                <div className="flex-1 h-px bg-separator" />
              </div>
              {day.isToday && (
                <div className="relative h-0 my-0.5">
                  <div className="absolute left-0 right-0 border-t border-accent/50 border-dashed" />
                  <div className="absolute -top-[3px] left-0 w-1.5 h-1.5 rounded-full bg-accent" />
                </div>
              )}
              {entries.length === 0 && (
                <p className="text-[10px] text-fg-tertiary pl-3 mb-1">Inget planerat</p>
              )}
              {entries.map(entry => (
                <div key={entry.id} className="flex items-center gap-1.5 pl-1 py-0.5">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: entry.color }} />
                  {entry.time && <span className="text-[9px] text-fg-tertiary font-mono w-8 shrink-0">{entry.time}</span>}
                  <span className="text-[11px] text-foreground truncate">{entry.title}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

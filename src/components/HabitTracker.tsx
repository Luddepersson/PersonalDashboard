"use client";

import { useState, useEffect } from "react";
import { Target, Plus, X } from "lucide-react";
import GlassCard from "./GlassCard";
import { triggerConfetti } from "@/components/Confetti";

interface Habit { id: string; name: string; color: string; completedDates: string[]; }

const COLORS = ["#0e88b0", "#e07a5f", "#69db7c", "#da77f2", "#ffa94d", "#d4b896"];

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push(d.toISOString().split("T")[0]); }
  return days;
}

function getDayLabel(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length !== 3) return "?";
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12);
  if (isNaN(d.getTime())) return "?";
  return d.toLocaleDateString("sv-SE", { weekday: "short" }).charAt(0).toUpperCase();
}

export default function HabitTracker() {
  const [mounted, setMounted] = useState(false);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(COLORS[0]);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("dashboard-habits");
    if (saved) { try { setHabits(JSON.parse(saved)); } catch { /* */ } }
  }, []);

  if (!mounted) return <GlassCard className="flex items-center justify-center"><div className="h-6 w-24 rounded bg-separator animate-pulse" /></GlassCard>;

  const last7 = getLast7Days();
  const today = last7[last7.length - 1];

  function save(updated: Habit[]) { setHabits(updated); localStorage.setItem("dashboard-habits", JSON.stringify(updated)); }

  function toggleHabit(habitId: string, date: string) {
    const updated = habits.map((h) => {
      if (h.id !== habitId) return h;
      const has = h.completedDates.includes(date);
      return { ...h, completedDates: has ? h.completedDates.filter((d) => d !== date) : [...h.completedDates, date] };
    });
    save(updated);
    const todayStr = getLast7Days().pop()!;
    const allDone = updated.every(h => h.completedDates.includes(todayStr));
    if (allDone && updated.length > 0) triggerConfetti();
  }

  function addHabit() { if (!newName.trim()) return; save([...habits, { id: Date.now().toString(), name: newName.trim(), color: newColor, completedDates: [] }]); setNewName(""); setShowAdd(false); }
  function removeHabit(id: string) { save(habits.filter((h) => h.id !== id)); }

  const todayDone = habits.filter((h) => h.completedDates.includes(today)).length;
  const todayProgress = habits.length > 0 ? (todayDone / habits.length) * 100 : 0;

  return (
    <GlassCard className="flex flex-col" hover3d={false}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-fg-secondary uppercase tracking-wider">Vanor</p>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-ghost !p-1 rounded-lg">
          {showAdd ? <X size={12} /> : <Plus size={12} />}
        </button>
      </div>

      {habits.length > 0 && (
        <div className="flex items-center gap-2.5 mb-2">
          <div className="relative w-10 h-10 shrink-0">
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--separator)" strokeWidth="2.5" />
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeDasharray={`${todayProgress}, 100`} strokeLinecap="round" className="transition-all duration-500" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-foreground">{todayDone}/{habits.length}</span>
          </div>
          <div>
            <p className="text-xs font-medium text-foreground">Idag</p>
            <p className="text-[10px] text-fg-tertiary">{todayDone === habits.length ? "Alla klara!" : `${habits.length - todayDone} kvar`}</p>
          </div>
        </div>
      )}

      {habits.length === 0 && !showAdd && (
        <p className="text-xs text-fg-tertiary text-center flex-1 flex items-center justify-center">Lägg till vanor med +</p>
      )}

      {showAdd && (
        <div className="flex gap-1.5 mb-2">
          <input type="text" placeholder="Ny vana..." value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addHabit()} className="input-base !py-1 !text-xs flex-1" />
          <button onClick={addHabit} className="btn-primary !py-1 !px-2 !text-[10px]">+</button>
        </div>
      )}

      {habits.length > 0 && (
        <div className="flex-1 overflow-y-auto -mr-1 pr-1 space-y-1">
          <div className="flex items-center">
            <div className="w-16 sm:w-20 shrink-0" />
            <div className="flex-1 grid grid-cols-7 gap-0.5">
              {last7.map((d) => <div key={d} className="text-center text-[8px] text-fg-tertiary">{getDayLabel(d)}</div>)}
            </div>
          </div>
          {habits.map((habit) => (
            <div key={habit.id} className="group flex items-center">
              <div className="w-16 sm:w-20 flex items-center gap-1 pr-1 shrink-0 min-w-0">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: habit.color }} />
                <span className="text-[10px] text-fg-secondary truncate">{habit.name}</span>
                <button onClick={() => removeHabit(habit.id)} className="opacity-0 group-hover:opacity-100 text-fg-tertiary hover:text-accent-warm shrink-0 ml-auto"><X size={8} /></button>
              </div>
              <div className="flex-1 grid grid-cols-7 gap-0.5">
                {last7.map((date) => {
                  const done = habit.completedDates.includes(date);
                  return (
                    <button key={date} onClick={() => toggleHabit(habit.id, date)}
                      className={`aspect-square rounded transition-all ${done ? "" : "bg-separator hover:bg-fg-tertiary/20"}`}
                      style={done ? { background: `${habit.color}40`, border: `1px solid ${habit.color}50` } : undefined}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

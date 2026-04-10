"use client";

import { useState, useEffect } from "react";
import { Target, Plus, X, Check } from "lucide-react";
import { triggerConfetti } from "@/components/Confetti";

interface Habit { id: string; name: string; color: string; completedDates: string[]; }

const COLORS = ["#0e88b0", "#e07a5f", "#69db7c", "#da77f2", "#ffa94d", "#d4b896"];

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

function getDayLabel(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length !== 3) return "?";
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12);
  if (isNaN(d.getTime())) return "?";
  return d.toLocaleDateString("sv-SE", { weekday: "short" }).slice(0, 3);
}

export default function HabitsPage() {
  const [mounted, setMounted] = useState(false);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(COLORS[0]);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("dashboard-habits");
    if (saved) { try { setHabits(JSON.parse(saved)); } catch {} }
  }, []);

  if (!mounted) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="h-8 w-48 rounded bg-separator animate-pulse" />
          <div className="h-4 w-64 rounded bg-separator animate-pulse mt-3" />
        </div>
        <div className="h-40 rounded-xl bg-separator animate-pulse" />
      </div>
    );
  }

  const last7 = getLast7Days();
  const today = last7[last7.length - 1];

  function save(updated: Habit[]) {
    setHabits(updated);
    localStorage.setItem("dashboard-habits", JSON.stringify(updated));
  }

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

  function addHabit() {
    if (!newName.trim()) return;
    save([...habits, { id: Date.now().toString(), name: newName.trim(), color: newColor, completedDates: [] }]);
    setNewName("");
  }

  function removeHabit(id: string) {
    save(habits.filter((h) => h.id !== id));
  }

  const todayDone = habits.filter((h) => h.completedDates.includes(today)).length;
  const todayProgress = habits.length > 0 ? (todayDone / habits.length) * 100 : 0;
  const circumference = 2 * Math.PI * 60;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tighter">Vanor</h1>
        <p className="text-sm text-fg-secondary mt-1.5">Folj upp dina dagliga vanor och bygg streak</p>
      </div>

      {/* Progress Ring + Stats */}
      {habits.length > 0 && (
        <div className="glass p-6 sm:p-8 mb-6 flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
          <div className="relative w-36 h-36 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="60" fill="none" stroke="var(--separator)" strokeWidth="6" />
              <circle
                cx="70" cy="70" r="60"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={`${circumference}`}
                strokeDashoffset={`${circumference * (1 - todayProgress / 100)}`}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-foreground">{todayDone}/{habits.length}</span>
              <span className="text-xs text-fg-tertiary mt-1">idag</span>
            </div>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-lg font-semibold text-foreground">
              {todayDone === habits.length && habits.length > 0
                ? "Alla vanor klara idag!"
                : `${habits.length - todayDone} vanor kvar idag`}
            </p>
            <p className="text-sm text-fg-tertiary mt-1">
              {Math.round(todayProgress)}% avklarad idag
            </p>
          </div>
        </div>
      )}

      {/* Add Habit Form -- always visible */}
      <div className="glass p-5 sm:p-6 mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-3">Lagg till ny vana</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Namn pa vanan..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addHabit()}
            className="input-base flex-1 !py-2.5"
          />
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    newColor === c ? "scale-110 ring-2 ring-offset-2 ring-accent/30" : ""
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
            <button onClick={addHabit} className="btn-primary !py-2.5 !px-5 flex items-center gap-2 shrink-0">
              <Plus size={16} /> Lagg till
            </button>
          </div>
        </div>
      </div>

      {/* Habits as cards */}
      {habits.length === 0 && (
        <div className="glass p-12 text-center">
          <Target size={40} className="text-fg-tertiary/30 mx-auto mb-4" />
          <p className="text-base text-fg-tertiary">Inga vanor annu</p>
          <p className="text-sm text-fg-tertiary/60 mt-1">Lagg till din forsta vana ovan</p>
        </div>
      )}

      <div className="space-y-3">
        {habits.map((habit) => (
          <div key={habit.id} className="glass p-5 sm:p-6 group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ background: habit.color }} />
                <span className="text-base font-medium text-foreground">{habit.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-fg-tertiary">
                  {habit.completedDates.filter(d => last7.includes(d)).length}/7 denna vecka
                </span>
                <button
                  onClick={() => removeHabit(habit.id)}
                  className="opacity-0 group-hover:opacity-100 btn-ghost p-1.5 text-fg-tertiary hover:text-accent-warm transition-opacity"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {last7.map((date) => {
                const done = habit.completedDates.includes(date);
                return (
                  <button
                    key={date}
                    onClick={() => toggleHabit(habit.id, date)}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all ${
                      done
                        ? ""
                        : "bg-separator/50 hover:bg-separator"
                    }`}
                    style={done ? { background: `${habit.color}20`, border: `1px solid ${habit.color}40` } : undefined}
                  >
                    <span className="text-xs text-fg-tertiary">{getDayLabel(date)}</span>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      done ? "text-white" : "text-fg-tertiary/30"
                    }`}
                      style={done ? { background: habit.color } : undefined}
                    >
                      {done && <Check size={16} strokeWidth={3} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

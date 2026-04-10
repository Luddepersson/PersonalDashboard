"use client";

import { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const ACCENT = "#2e94be";
const ACCENT_LIGHT = "#5bb8d8";
const ACCENT_DIM = "#1a6d8f";

interface Todo {
  id: string;
  text: string;
  done: boolean;
}

interface Habit {
  id: string;
  name: string;
  color: string;
  completedDates: string[];
}

function generateWeeklyPomodoros(totalPomodoros: number) {
  const days = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];
  const base = Math.max(1, Math.floor(totalPomodoros / 7));
  return days.map((day, i) => {
    const variance = Math.round((Math.sin(i * 1.8 + 2) + 1) * base * 0.6);
    const sessions = Math.max(0, base + variance + (i < 5 ? 1 : -1));
    return { day, sessions };
  });
}

function getStreaks(habit: Habit): number {
  const sorted = [...habit.completedDates].sort().reverse();
  if (sorted.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  for (let i = 0; i <= 60; i++) {
    const check = new Date(today);
    check.setDate(check.getDate() - i);
    const dateStr = check.toISOString().split("T")[0];
    if (sorted.includes(dateStr)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [pomodoroCount, setPomodoroCount] = useState(0);

  useEffect(() => {
    setMounted(true);
    try {
      const t = JSON.parse(localStorage.getItem("dashboard-todos") || "[]");
      setTodos(t);
    } catch { /* */ }
    try {
      const h = JSON.parse(localStorage.getItem("dashboard-habits") || "[]");
      setHabits(h);
    } catch { /* */ }
    const p = parseInt(localStorage.getItem("pomodoro-count") || "0", 10);
    setPomodoroCount(p);
  }, []);

  const weeklyData = useMemo(
    () => generateWeeklyPomodoros(pomodoroCount),
    [pomodoroCount]
  );

  const completedTodos = todos.filter((t) => t.done).length;
  const pendingTodos = todos.length - completedTodos;

  const taskPieData = useMemo(() => {
    if (todos.length === 0) {
      return [
        { name: "Klara", value: 3, color: ACCENT },
        { name: "Kvar", value: 2, color: ACCENT_DIM },
      ];
    }
    return [
      { name: "Klara", value: completedTodos, color: ACCENT },
      { name: "Kvar", value: pendingTodos, color: ACCENT_DIM },
    ];
  }, [todos, completedTodos, pendingTodos]);

  const habitStreaks = useMemo(() => {
    if (habits.length === 0) {
      return [
        { name: "Träning", streak: 5, color: "#0e88b0" },
        { name: "Läsning", streak: 3, color: "#e07a5f" },
        { name: "Meditation", streak: 7, color: "#69db7c" },
      ];
    }
    return habits.map((h) => ({
      name: h.name,
      streak: getStreaks(h),
      color: h.color,
    }));
  }, [habits]);

  const completionRate =
    todos.length > 0
      ? Math.round((completedTodos / todos.length) * 100)
      : 60;

  if (!mounted) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-foreground">Statistik</h1>
          <p className="text-sm text-fg-secondary mt-0.5">
            Din produktivitet over tid
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass p-5 min-h-[300px] animate-pulse">
              <div className="h-4 w-32 bg-separator rounded mb-4" />
              <div className="h-48 bg-separator/50 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Statistik</h1>
        <p className="text-sm text-fg-secondary mt-0.5">
          Din produktivitet &ouml;ver tid
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Pomodoros", value: pomodoroCount || 12 },
          { label: "Uppgifter klara", value: completedTodos || 3 },
          { label: "Vanor", value: habits.length || 3 },
          { label: "Slutforingsgrad", value: `${completionRate}%` },
        ].map((s) => (
          <div key={s.label} className="glass p-4 text-center">
            <p className="text-2xl font-semibold text-foreground">{s.value}</p>
            <p className="text-[11px] text-fg-tertiary uppercase tracking-wider mt-1">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Weekly pomodoro bar chart */}
        <div className="glass p-5">
          <h2 className="text-sm font-medium text-fg-secondary uppercase tracking-wider mb-4">
            Pomodoro-sessioner per vecka
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.08)"
              />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "var(--fg-tertiary)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--fg-tertiary)" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(20,30,40,0.85)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "10px",
                  backdropFilter: "blur(12px)",
                  fontSize: 12,
                  color: "var(--foreground)",
                }}
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
              />
              <Bar
                dataKey="sessions"
                fill={ACCENT}
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Task completion donut */}
        <div className="glass p-5">
          <h2 className="text-sm font-medium text-fg-secondary uppercase tracking-wider mb-4">
            Uppgifter - slutforingsgrad
          </h2>
          <div className="flex items-center justify-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie
                  data={taskPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {taskPieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "rgba(20,30,40,0.85)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "10px",
                    fontSize: 12,
                    color: "var(--foreground)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {taskPieData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ background: entry.color }}
                  />
                  <span className="text-sm text-fg-secondary">
                    {entry.name}
                  </span>
                  <span className="text-sm font-medium text-foreground ml-1">
                    {entry.value}
                  </span>
                </div>
              ))}
              <div className="pt-1 border-t border-separator/50">
                <span className="text-lg font-semibold text-foreground">
                  {completionRate}%
                </span>
                <span className="text-[11px] text-fg-tertiary ml-1.5">
                  klart
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Habit streak overview */}
        <div className="glass p-5 md:col-span-2">
          <h2 className="text-sm font-medium text-fg-secondary uppercase tracking-wider mb-4">
            Vanestreaks
          </h2>
          {habitStreaks.length === 0 ? (
            <p className="text-sm text-fg-tertiary text-center py-8">
              Inga vanor att visa. Lagg till vanor for att se dina streaks.
            </p>
          ) : (
            <div className="space-y-3">
              {habitStreaks.map((h) => {
                const maxStreak = Math.max(
                  ...habitStreaks.map((s) => s.streak),
                  1
                );
                const pct = (h.streak / maxStreak) * 100;
                return (
                  <div key={h.name} className="flex items-center gap-3">
                    <div className="w-28 shrink-0 flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: h.color }}
                      />
                      <span className="text-sm text-fg-secondary truncate">
                        {h.name}
                      </span>
                    </div>
                    <div className="flex-1 h-6 rounded-lg bg-surface/50 overflow-hidden relative">
                      <div
                        className="h-full rounded-lg transition-all duration-700"
                        style={{
                          width: `${Math.max(pct, 8)}%`,
                          background: `linear-gradient(90deg, ${h.color}80, ${h.color})`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-foreground w-16 text-right">
                      {h.streak} {h.streak === 1 ? "dag" : "dagar"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

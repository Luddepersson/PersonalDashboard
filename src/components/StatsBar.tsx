"use client";

import { useState, useEffect } from "react";
import { ListTodo, Target, Clock, GitBranch, TrendingUp } from "lucide-react";

interface DashboardStats {
  totalTodos: number;
  completedTodos: number;
  habitsToday: number;
  totalHabits: number;
  pomodorosToday: number;
  githubUser: string | null;
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    const duration = 600;
    const steps = 25;
    const inc = value / steps;
    let current = 0;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      current = Math.min(current + inc, value);
      if (step >= steps) { current = value; clearInterval(timer); }
      setDisplay(Math.round(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return <span>{display}</span>;
}

export default function StatsBar() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalTodos: 0, completedTodos: 0,
    habitsToday: 0, totalHabits: 0,
    pomodorosToday: 0, githubUser: null,
  });

  useEffect(() => {
    setMounted(true);
    function load() {
      const todos = (() => { try { return JSON.parse(localStorage.getItem("dashboard-todos") || "[]"); } catch { return []; } })();
      const habits = (() => { try { return JSON.parse(localStorage.getItem("dashboard-habits") || "[]"); } catch { return []; } })();
      const today = new Date().toISOString().split("T")[0];
      const pomodoros = parseInt(localStorage.getItem("pomodoro-count") || "0", 10);
      const github = localStorage.getItem("github-username");

      setStats({
        totalTodos: todos.length,
        completedTodos: todos.filter((t: { done: boolean }) => t.done).length,
        habitsToday: habits.filter((h: { completedDates: string[] }) => h.completedDates?.includes(today)).length,
        totalHabits: habits.length,
        pomodorosToday: pomodoros,
        githubUser: github,
      });
    }
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  const items = [
    {
      label: "Uppgifter",
      value: stats.completedTodos,
      total: stats.totalTodos,
      icon: <ListTodo className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />,
      color: "#38a3c9",
      trend: stats.totalTodos > 0 ? `${Math.round((stats.completedTodos / stats.totalTodos) * 100)}%` : null,
    },
    {
      label: "Vanor idag",
      value: stats.habitsToday,
      total: stats.totalHabits,
      icon: <Target className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />,
      color: "#7eb8ce",
      trend: stats.habitsToday === stats.totalHabits && stats.totalHabits > 0 ? "Klart!" : null,
    },
    {
      label: "Pomodoros",
      value: stats.pomodorosToday,
      total: null,
      icon: <Clock className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />,
      color: "#5bb8d8",
      trend: stats.pomodorosToday > 0 ? `${Math.round(stats.pomodorosToday * 25 / 60)}h` : null,
    },
    {
      label: "GitHub",
      value: null,
      total: null,
      icon: <GitBranch className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />,
      color: "#3d8ba8",
      displayValue: stats.githubUser ? "Kopplat" : "—",
      trend: stats.githubUser ? `@${stats.githubUser}` : null,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-2.5 md:gap-3 mb-5 sm:mb-7">
      {items.map((item) => (
        <div
          key={item.label}
          className="glass !p-3 sm:!p-4 flex items-center gap-2 sm:gap-3"
        >
          <div
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${item.color}12`, color: item.color }}
          >
            {item.icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-[11px] text-fg-secondary uppercase tracking-[0.04em]">{item.label}</p>
            <div className="flex items-baseline gap-1 sm:gap-1.5">
              <p className="text-base sm:text-xl font-semibold text-foreground leading-tight">
                {item.displayValue ?? (
                  <>
                    <AnimatedNumber value={item.value ?? 0} />
                    {item.total !== null && <span className="text-sm text-fg-tertiary font-normal">/{item.total}</span>}
                  </>
                )}
              </p>
              {item.trend && (
                <span className="text-[10px] font-medium flex items-center gap-0.5" style={{ color: item.color }}>
                  {item.trend}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

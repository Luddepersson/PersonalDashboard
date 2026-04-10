"use client";

import { useState, useEffect, useCallback } from "react";
import { Play, Pause, RotateCcw, Zap, Clock, Flame, TrendingUp } from "lucide-react";

type Mode = "work" | "short-break" | "long-break";
const MODES: Record<Mode, { label: string; minutes: number; color: string }> = {
  work: { label: "Fokus", minutes: 25, color: "var(--accent)" },
  "short-break": { label: "Kort paus", minutes: 5, color: "#69db7c" },
  "long-break": { label: "Lang paus", minutes: 15, color: "#da77f2" },
};

export default function PomodoroPage() {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<Mode>("work");
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completed, setCompleted] = useState(0);

  useEffect(() => {
    setMounted(true);
    const s = localStorage.getItem("pomodoro-count");
    if (s) setCompleted(parseInt(s, 10) || 0);
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    const i = setInterval(() => {
      setSecondsLeft((p) => {
        if (p <= 1) {
          setIsRunning(false);
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification("Pomodoro", { body: `${MODES[mode].label} klar!` });
          }
          if (mode === "work") {
            const n = completed + 1;
            setCompleted(n);
            localStorage.setItem("pomodoro-count", n.toString());
            localStorage.setItem("pomodoroCompletedCount", n.toString());
            switchMode(n % 4 === 0 ? "long-break" : "short-break");
          } else {
            switchMode("work");
          }
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(i);
  }, [isRunning, mode, completed]);

  function switchMode(m: Mode) {
    setMode(m);
    setSecondsLeft(MODES[m].minutes * 60);
    setIsRunning(false);
  }

  function reset() {
    setSecondsLeft(MODES[mode].minutes * 60);
    setIsRunning(false);
  }

  if (!mounted) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="h-8 w-48 rounded bg-separator animate-pulse" />
          <div className="h-4 w-64 rounded bg-separator animate-pulse mt-3" />
        </div>
        <div className="flex justify-center py-20">
          <div className="w-56 h-56 rounded-full bg-separator animate-pulse" />
        </div>
      </div>
    );
  }

  const total = MODES[mode].minutes * 60;
  const progress = ((total - secondsLeft) / total) * 100;
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const circumference = 2 * Math.PI * 110;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tighter">Pomodoro Timer</h1>
        <p className="text-sm text-fg-secondary mt-1.5">Fokusera med tidsintervaller. Jobba smart, ta pauser.</p>
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-2 mb-10 p-1 rounded-xl bg-surface/50 max-w-md mx-auto">
        {(Object.entries(MODES) as [Mode, typeof MODES.work][]).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => switchMode(key)}
            className={`flex-1 text-sm py-2.5 rounded-lg transition-all font-medium ${
              mode === key
                ? "bg-white/20 text-accent shadow-sm"
                : "text-fg-tertiary hover:text-fg-secondary"
            }`}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      {/* Large Timer Ring */}
      <div className="flex justify-center mb-10">
        <div className="relative w-56 h-56 sm:w-64 sm:h-64">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 240 240">
            <circle
              cx="120" cy="120" r="110"
              fill="none"
              stroke="var(--separator)"
              strokeWidth="4"
            />
            <circle
              cx="120" cy="120" r="110"
              fill="none"
              stroke={MODES[mode].color}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${circumference}`}
              strokeDashoffset={`${circumference * (1 - progress / 100)}`}
              className="transition-all duration-1000"
              style={{ filter: `drop-shadow(0 0 8px ${MODES[mode].color}40)` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl sm:text-6xl font-light font-mono text-foreground tracking-wider">
              {mins.toString().padStart(2, "0")}:{secs.toString().padStart(2, "0")}
            </span>
            <span className="text-xs text-fg-tertiary mt-2 uppercase tracking-widest">
              {MODES[mode].label}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4 mb-12">
        <button
          onClick={() => {
            if (typeof Notification !== "undefined" && Notification.permission === "default") {
              Notification.requestPermission();
            }
            setIsRunning(!isRunning);
          }}
          className="btn-primary flex items-center gap-2.5 !py-3.5 !px-10 !rounded-xl text-base font-medium"
        >
          {isRunning ? <Pause size={20} /> : <Play size={20} />}
          {isRunning ? "Pausa" : "Starta"}
        </button>
        <button
          onClick={reset}
          className="btn-ghost p-3.5 rounded-xl"
        >
          <RotateCcw size={20} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass p-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Zap size={16} className="text-accent" />
            <span className="text-xs text-fg-tertiary uppercase tracking-wider">Pomodoros</span>
          </div>
          <p className="text-4xl font-bold text-foreground">{completed}</p>
          <p className="text-xs text-fg-secondary mt-1">Avslutade idag</p>
        </div>
        <div className="glass p-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Clock size={16} className="text-accent" />
            <span className="text-xs text-fg-tertiary uppercase tracking-wider">Fokustid</span>
          </div>
          <p className="text-4xl font-bold text-foreground">{Math.round(completed * 25)}</p>
          <p className="text-xs text-fg-secondary mt-1">Minuter totalt</p>
        </div>
        <div className="glass p-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <TrendingUp size={16} className="text-accent" />
            <span className="text-xs text-fg-tertiary uppercase tracking-wider">Timmar</span>
          </div>
          <p className="text-4xl font-bold text-foreground">{(completed * 25 / 60).toFixed(1)}</p>
          <p className="text-xs text-fg-secondary mt-1">Fokustimmar</p>
        </div>
        <div className="glass p-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Flame size={16} className="text-accent" />
            <span className="text-xs text-fg-tertiary uppercase tracking-wider">Cykler</span>
          </div>
          <p className="text-4xl font-bold text-foreground">{Math.floor(completed / 4)}</p>
          <p className="text-xs text-fg-secondary mt-1">Fullstandiga (4x25)</p>
        </div>
      </div>
    </div>
  );
}

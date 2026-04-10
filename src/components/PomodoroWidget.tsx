"use client";

import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Zap } from "lucide-react";
import GlassCard from "./GlassCard";

type Mode = "work" | "short-break" | "long-break";
const MODES: Record<Mode, { label: string; minutes: number }> = {
  work: { label: "Fokus", minutes: 25 },
  "short-break": { label: "Paus", minutes: 5 },
  "long-break": { label: "Lång paus", minutes: 15 },
};

export default function PomodoroWidget() {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<Mode>("work");
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completed, setCompleted] = useState(0);

  useEffect(() => { setMounted(true); const s = localStorage.getItem("pomodoro-count"); if (s) setCompleted(parseInt(s, 10) || 0); }, []);

  useEffect(() => {
    if (!isRunning) return;
    const i = setInterval(() => {
      setSecondsLeft((p) => {
        if (p <= 1) {
          setIsRunning(false);
          if (typeof Notification !== "undefined" && Notification.permission === "granted") new Notification("Pomodoro", { body: `${MODES[mode].label} klar!` });
          if (mode === "work") { const n = completed + 1; setCompleted(n); localStorage.setItem("pomodoro-count", n.toString()); switchMode(n % 4 === 0 ? "long-break" : "short-break"); }
          else switchMode("work");
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(i);
  }, [isRunning, mode, completed]);

  function switchMode(m: Mode) { setMode(m); setSecondsLeft(MODES[m].minutes * 60); setIsRunning(false); }
  function reset() { setSecondsLeft(MODES[mode].minutes * 60); setIsRunning(false); }

  if (!mounted) return <GlassCard className="flex items-center justify-center"><div className="h-16 w-16 rounded-full bg-surface animate-pulse" /></GlassCard>;

  const total = MODES[mode].minutes * 60;
  const progress = ((total - secondsLeft) / total) * 100;
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <GlassCard className={`flex flex-col ${isRunning ? "animate-pulse-glow" : ""}`}>
      {/* Mode tabs */}
      <div className="flex gap-1 mb-3 p-0.5 rounded-lg bg-surface/50">
        {(Object.entries(MODES) as [Mode, typeof MODES.work][]).map(([key, cfg]) => (
          <button key={key} onClick={() => switchMode(key)}
            className={`flex-1 text-[10px] py-1 rounded-md transition-all font-medium ${mode === key ? "bg-white/30 text-accent shadow-sm" : "text-fg-tertiary hover:text-fg-secondary"}`}
          >{cfg.label}</button>
        ))}
      </div>

      {/* Timer ring — compact */}
      <div className="flex justify-center mb-3">
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--separator)" strokeWidth="3" />
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 52}`} strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress / 100)}`}
              className="transition-all duration-1000" style={{ filter: "drop-shadow(0 0 3px rgba(46,148,190,0.3))" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-light font-mono text-foreground">{mins.toString().padStart(2, "0")}:{secs.toString().padStart(2, "0")}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-2 mb-2">
        <button onClick={() => { if (typeof Notification !== "undefined" && Notification.permission === "default") Notification.requestPermission(); setIsRunning(!isRunning); }}
          className="btn-primary flex items-center gap-1.5 !py-1.5 !px-4 !rounded-lg text-xs">
          {isRunning ? <Pause size={13} /> : <Play size={13} />}
          {isRunning ? "Paus" : "Starta"}
        </button>
        <button onClick={reset} className="btn-ghost p-2 rounded-lg"><RotateCcw size={13} /></button>
      </div>

      <div className="flex items-center justify-center gap-3 pt-2 border-t border-separator text-[10px] text-fg-tertiary mt-auto">
        <span className="flex items-center gap-1"><Zap size={9} className="text-accent" />{completed} pomodoros</span>
      </div>
    </GlassCard>
  );
}

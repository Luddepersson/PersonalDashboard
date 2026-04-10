"use client";

import { useState, useEffect, useRef } from "react";
import { Timer, Play, Pause } from "lucide-react";
import GlassCard from "../GlassCard";

interface TimeEntry { id: string; project: string; seconds: number; date: string; running: boolean }

const KEY = "dashboard-timetrack";
const today = () => new Date().toISOString().split("T")[0];

function fmtTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}h ${m.toString().padStart(2, "0")}m` : `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function TimeTrackWidget() {
  const [mounted, setMounted] = useState(false);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [project, setProject] = useState("");

  useEffect(() => {
    setMounted(true);
    try { const s = localStorage.getItem(KEY); if (s) setEntries(JSON.parse(s)); } catch {}
  }, []);

  // Tick running entries every second
  useEffect(() => {
    if (!mounted) return;
    const iv = setInterval(() => {
      setEntries(prev => {
        const hasRunning = prev.some(e => e.running);
        if (!hasRunning) return prev;
        const updated = prev.map(e => e.running ? { ...e, seconds: e.seconds + 1 } : e);
        localStorage.setItem(KEY, JSON.stringify(updated));
        return updated;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [mounted]);

  // All hooks above — safe to return early now
  if (!mounted) return <GlassCard className="flex items-center justify-center"><div className="h-6 w-24 rounded bg-separator animate-pulse" /></GlassCard>;

  function save(updated: TimeEntry[]) { setEntries(updated); localStorage.setItem(KEY, JSON.stringify(updated)); }

  const running = entries.find(e => e.running);
  const todayEntries = entries.filter(e => e.date === today());
  const todayTotal = todayEntries.reduce((sum, e) => sum + e.seconds, 0);

  function startTimer() {
    if (!project.trim()) return;
    const stopped = entries.map(e => e.running ? { ...e, running: false } : e);
    save([...stopped, { id: Date.now().toString(), project: project.trim(), seconds: 0, date: today(), running: true }]);
    setProject("");
  }

  function toggleRunning(id: string) {
    save(entries.map(e => {
      if (e.id === id) return { ...e, running: !e.running };
      if (e.running) return { ...e, running: false };
      return e;
    }));
  }

  return (
    <GlassCard className="flex flex-col">
      <div className="flex items-center gap-1.5 mb-2">
        <Timer size={12} className="text-accent" />
        <p className="text-xs font-medium text-fg-secondary uppercase tracking-wider">Tidrapport</p>
      </div>

      {running ? (
        <div className="flex items-center gap-2 p-1.5 rounded-lg bg-surface/50 mb-2">
          <button onClick={() => toggleRunning(running.id)} className="btn-primary !p-1 !rounded-md"><Pause size={11} /></button>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-foreground font-medium truncate">{running.project}</p>
            <p className="text-xs font-mono text-accent">{fmtTime(running.seconds)}</p>
          </div>
        </div>
      ) : (
        <div className="flex gap-1 mb-2">
          <input type="text" placeholder="Projektnamn..." value={project} onChange={e => setProject(e.target.value)}
            onKeyDown={e => e.key === "Enter" && startTimer()} className="input-base !py-1 !text-xs flex-1" />
          <button onClick={startTimer} className="btn-primary !py-1 !px-2 flex items-center gap-0.5 !text-[10px]">
            <Play size={10} /> Start
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto -mr-1 pr-1 space-y-0.5">
        {todayEntries.filter(e => !e.running).length === 0 && !running && (
          <p className="text-[10px] text-fg-tertiary text-center mt-4">Inga tider idag</p>
        )}
        {todayEntries.filter(e => !e.running).map(entry => (
          <div key={entry.id} className="flex items-center justify-between py-0.5 px-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-1 h-1 rounded-full bg-accent shrink-0" />
              <span className="text-[10px] text-fg-secondary truncate">{entry.project}</span>
            </div>
            <span className="text-[10px] font-mono text-fg-tertiary shrink-0">{fmtTime(entry.seconds)}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-1.5 border-t border-separator mt-auto">
        <span className="text-[10px] text-fg-tertiary">Idag totalt</span>
        <span className="text-xs font-mono font-medium text-foreground">{fmtTime(todayTotal)}</span>
      </div>
    </GlassCard>
  );
}

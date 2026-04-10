"use client";

import { useState, useEffect } from "react";
import { CalendarClock, Plus, X } from "lucide-react";
import GlassCard from "../GlassCard";

interface Countdown { id: string; title: string; date: string; color: string }

const KEY = "dashboard-countdowns";
const COLORS = ["#0e88b0", "#e07a5f", "#69db7c", "#da77f2", "#ffa94d", "#f06595"];

function getRemaining(dateStr: string): { days: number; hours: number; passed: boolean } {
  const target = new Date(dateStr + "T00:00:00").getTime();
  const now = Date.now();
  const diff = target - now;
  if (diff <= 0) return { days: 0, hours: 0, passed: true };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return { days, hours, passed: false };
}

export default function CountdownWidget() {
  const [mounted, setMounted] = useState(false);
  const [countdowns, setCountdowns] = useState<Countdown[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [, setTick] = useState(0);

  useEffect(() => {
    setMounted(true);
    try { const s = localStorage.getItem(KEY); if (s) setCountdowns(JSON.parse(s)); } catch {}
    const i = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(i);
  }, []);

  if (!mounted) return <GlassCard className="flex items-center justify-center"><div className="h-6 w-24 rounded bg-separator animate-pulse" /></GlassCard>;

  function save(updated: Countdown[]) { setCountdowns(updated); localStorage.setItem(KEY, JSON.stringify(updated)); }

  function addCountdown() {
    if (!title.trim() || !date) return;
    save([...countdowns, { id: Date.now().toString(), title: title.trim(), date, color }]);
    setTitle(""); setDate(""); setShowAdd(false);
  }

  function remove(id: string) { save(countdowns.filter(c => c.id !== id)); }

  return (
    <GlassCard className="flex flex-col h-[280px]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <CalendarClock size={12} className="text-accent" />
          <p className="text-xs font-medium text-fg-secondary uppercase tracking-wider">Nedräkning</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-ghost !p-1 rounded-lg">
          {showAdd ? <X size={12} /> : <Plus size={12} />}
        </button>
      </div>

      {showAdd && (
        <div className="space-y-1 mb-2 p-1.5 rounded-lg bg-surface/50">
          <input type="text" placeholder="Titel..." value={title} onChange={e => setTitle(e.target.value)} className="input-base !py-1 !text-xs w-full" />
          <div className="flex gap-1">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-base !py-1 !text-xs flex-1" />
            <button onClick={addCountdown} className="btn-primary !py-1 !px-2 !text-[10px]">+</button>
          </div>
          <div className="flex gap-1">
            {COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)}
                className={`w-4 h-4 rounded-full transition-all ${color === c ? "ring-1 ring-offset-1 ring-accent scale-110" : ""}`}
                style={{ background: c }} />
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto -mr-1 pr-1 space-y-1.5">
        {countdowns.length === 0 && !showAdd && (
          <p className="text-xs text-fg-tertiary text-center mt-8">Lägg till en nedräkning</p>
        )}
        {countdowns.map(cd => {
          const { days, hours, passed } = getRemaining(cd.date);
          const totalDays = Math.max(1, Math.ceil((new Date(cd.date + "T00:00:00").getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
          const progressPct = passed ? 100 : Math.max(0, 100 - (totalDays / Math.max(totalDays, 30)) * 100);

          return (
            <div key={cd.id} className="group flex items-center gap-2 py-1 px-1.5 rounded-lg hover:bg-surface/30 transition-colors">
              {/* Mini progress ring */}
              <div className="relative w-8 h-8 shrink-0">
                <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="var(--separator)" strokeWidth="2.5" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke={cd.color} strokeWidth="2.5"
                    strokeDasharray={`${passed ? 100 : Math.min(95, progressPct)}, 100`} strokeLinecap="round"
                    className="transition-all duration-500" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold text-foreground">
                  {passed ? "✓" : days}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-foreground font-medium truncate">{cd.title}</p>
                {passed ? (
                  <p className="text-[9px] text-fg-tertiary">Passerat</p>
                ) : (
                  <p className="text-[9px] text-fg-tertiary">
                    {days > 0 ? `${days}d ` : ""}{hours}h kvar
                  </p>
                )}
              </div>

              <button onClick={() => remove(cd.id)} className="opacity-0 group-hover:opacity-100 text-fg-tertiary hover:text-accent-warm shrink-0">
                <X size={10} />
              </button>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

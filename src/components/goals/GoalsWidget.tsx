"use client";

import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import GlassCard from "../GlassCard";

interface Goal { id: string; title: string; target: number; current: number; unit: string; period: "week" | "month" }

const KEY = "dashboard-goals";

export default function GoalsWidget() {
  const [mounted, setMounted] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("h");
  const [period, setPeriod] = useState<"week" | "month">("week");

  useEffect(() => {
    setMounted(true);
    try { const s = localStorage.getItem(KEY); if (s) setGoals(JSON.parse(s)); } catch {}
  }, []);

  if (!mounted) return <GlassCard className="flex items-center justify-center"><div className="h-6 w-24 rounded bg-separator animate-pulse" /></GlassCard>;

  function save(updated: Goal[]) { setGoals(updated); localStorage.setItem(KEY, JSON.stringify(updated)); }

  function addGoal() {
    if (!title.trim() || !target) return;
    save([...goals, { id: Date.now().toString(), title: title.trim(), target: Number(target), current: 0, unit, period }]);
    setTitle(""); setTarget(""); setShowAdd(false);
  }

  function updateCurrent(id: string, delta: number) {
    save(goals.map(g => g.id === id ? { ...g, current: Math.max(0, g.current + delta) } : g));
  }

  function removeGoal(id: string) { save(goals.filter(g => g.id !== id)); }

  return (
    <GlassCard className="flex flex-col h-[280px]">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-fg-secondary uppercase tracking-wider">Mål</p>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-ghost !p-1 rounded-lg">
          {showAdd ? <X size={12} /> : <Plus size={12} />}
        </button>
      </div>

      {showAdd && (
        <div className="space-y-1 mb-2 p-1.5 rounded-lg bg-surface/50">
          <input type="text" placeholder="Mål..." value={title} onChange={e => setTitle(e.target.value)} className="input-base !py-1 !text-xs w-full" />
          <div className="flex gap-1">
            <input type="number" placeholder="Mål" value={target} onChange={e => setTarget(e.target.value)} className="input-base !py-1 !text-xs w-16" />
            <input type="text" placeholder="enhet" value={unit} onChange={e => setUnit(e.target.value)} className="input-base !py-1 !text-xs w-12" />
            <select value={period} onChange={e => setPeriod(e.target.value as "week" | "month")} className="input-base !py-1 !text-xs flex-1">
              <option value="week">Vecka</option>
              <option value="month">Månad</option>
            </select>
            <button onClick={addGoal} className="btn-primary !py-1 !px-2 !text-[10px]">+</button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto -mr-1 pr-1 space-y-2">
        {goals.length === 0 && !showAdd && (
          <p className="text-xs text-fg-tertiary text-center mt-8">Sätt ditt första mål</p>
        )}
        {goals.map(goal => {
          const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
          const done = pct >= 100;
          return (
            <div key={goal.id} className="group">
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-[11px] text-foreground truncate">{goal.title}</span>
                  <span className="text-[9px] text-fg-tertiary">({goal.period === "week" ? "v" : "m"})</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-[10px] font-mono ${done ? "text-accent" : "text-fg-secondary"}`}>{goal.current}/{goal.target}{goal.unit}</span>
                  <button onClick={() => removeGoal(goal.id)} className="opacity-0 group-hover:opacity-100 text-fg-tertiary hover:text-accent-warm"><X size={9} /></button>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => updateCurrent(goal.id, -1)} className="text-[10px] text-fg-tertiary hover:text-foreground w-4 text-center">-</button>
                <div className="flex-1 h-1.5 rounded-full bg-separator overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${done ? "bg-green-400" : "bg-accent"}`} style={{ width: `${pct}%` }} />
                </div>
                <button onClick={() => updateCurrent(goal.id, 1)} className="text-[10px] text-fg-tertiary hover:text-foreground w-4 text-center">+</button>
                <span className="text-[9px] text-fg-tertiary w-7 text-right">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

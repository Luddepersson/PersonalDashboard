"use client";

import { useState, useEffect } from "react";
import { UtensilsCrossed, Plus, X, ChevronDown } from "lucide-react";
import GlassCard from "../GlassCard";

type DayName = "Man" | "Tis" | "Ons" | "Tor" | "Fre" | "Lor" | "Son";
type MealType = "frukost" | "lunch" | "middag";

interface Meal {
  id: string;
  name: string;
  day: DayName;
  type: MealType;
  note?: string;
}

const DAYS: DayName[] = ["Man", "Tis", "Ons", "Tor", "Fre", "Lor", "Son"];
const DISPLAY: Record<DayName, string> = { Man: "Man", Tis: "Tis", Ons: "Ons", Tor: "Tor", Fre: "Fre", Lor: "Lor", Son: "Son" };
const TYPES: MealType[] = ["frukost", "lunch", "middag"];
const KEY = "dashboard-meals";

function todayDay(): DayName {
  const i = new Date().getDay(); // 0=Sun
  return DAYS[i === 0 ? 6 : i - 1];
}

export default function MealPrepWidget() {
  const [mounted, setMounted] = useState(false);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayName>(todayDay());
  const [name, setName] = useState("");
  const [day, setDay] = useState<DayName>(todayDay());
  const [type, setType] = useState<MealType>("lunch");

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(KEY);
    if (saved) try { setMeals(JSON.parse(saved)); } catch { /* */ }
  }, []);

  if (!mounted) return <GlassCard className="flex items-center justify-center"><div className="h-6 w-24 rounded bg-separator animate-pulse" /></GlassCard>;

  function save(m: Meal[]) { setMeals(m); localStorage.setItem(KEY, JSON.stringify(m)); }
  function addMeal() {
    if (!name.trim()) return;
    save([...meals, { id: Date.now().toString(), name: name.trim(), day, type }]);
    setName(""); setShowAdd(false);
  }
  function removeMeal(id: string) { save(meals.filter(m => m.id !== id)); }

  const today = todayDay();
  const dayMeals = meals.filter(m => m.day === selectedDay);

  return (
    <GlassCard className="flex flex-col h-[280px] p-3 gap-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UtensilsCrossed size={16} className="text-accent" />
          <span className="text-sm font-semibold text-foreground">Matlista</span>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-ghost p-1 rounded">
          {showAdd ? <X size={14} /> : <Plus size={14} />}
        </button>
      </div>

      {/* Week dots row */}
      <div className="flex gap-1 justify-between">
        {DAYS.map(d => {
          const count = meals.filter(m => m.day === d).length;
          const isToday = d === today;
          const isSelected = d === selectedDay;
          return (
            <button key={d} onClick={() => setSelectedDay(d)}
              className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded text-[10px] transition-all ${isSelected ? "bg-surface ring-1 ring-accent" : "hover:bg-surface"}`}>
              <span className={isToday ? "text-accent font-bold" : "text-fg-tertiary"}>{DISPLAY[d]}</span>
              {count > 0 ? (
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${isToday ? "bg-accent text-white" : "bg-separator text-fg-secondary"}`}>{count}</span>
              ) : (
                <span className="w-4 h-4 rounded-full bg-separator opacity-30" />
              )}
            </button>
          );
        })}
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="flex gap-1 items-end">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Matratt..."
            className="input-base text-xs flex-1 px-2 py-1" onKeyDown={e => e.key === "Enter" && addMeal()} />
          <select value={day} onChange={e => setDay(e.target.value as DayName)} className="input-base text-xs px-1 py-1 w-14">
            {DAYS.map(d => <option key={d} value={d}>{DISPLAY[d]}</option>)}
          </select>
          <select value={type} onChange={e => setType(e.target.value as MealType)} className="input-base text-xs px-1 py-1 w-18">
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button onClick={addMeal} className="btn-primary text-xs px-2 py-1 rounded">+</button>
        </div>
      )}

      {/* Day meals list */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-1">
        {dayMeals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-fg-tertiary text-xs">
            <UtensilsCrossed size={20} className="mb-1 opacity-40" />
            {meals.length === 0 ? "Planera veckans maltider" : `Inga maltider ${DISPLAY[selectedDay]}`}
          </div>
        ) : (
          dayMeals.map(m => (
            <div key={m.id} className="flex items-center justify-between bg-surface rounded px-2 py-1 group">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`text-[9px] px-1 rounded ${m.type === "frukost" ? "bg-amber-500/20 text-amber-400" : m.type === "lunch" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"}`}>
                  {m.type}
                </span>
                <span className="text-xs text-foreground truncate">{m.name}</span>
              </div>
              <button onClick={() => removeMeal(m.id)} className="btn-ghost p-0.5 rounded opacity-0 group-hover:opacity-100">
                <X size={12} />
              </button>
            </div>
          ))
        )}
      </div>
    </GlassCard>
  );
}

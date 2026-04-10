"use client";

import { useState, useEffect } from "react";
import { Film, Tv, Star, Plus, X } from "lucide-react";
import GlassCard from "../GlassCard";

type MovieType = "film" | "serie";
type Status = "vill-se" | "tittar" | "sett";

interface Movie {
  id: string;
  title: string;
  year?: number;
  type: MovieType;
  status: Status;
  rating?: number;
}

const KEY = "dashboard-movies";
const TABS: { key: Status; label: string }[] = [
  { key: "vill-se", label: "Vill se" },
  { key: "tittar", label: "Tittar" },
  { key: "sett", label: "Sett" },
];

export default function MovieWidget() {
  const [mounted, setMounted] = useState(false);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [tab, setTab] = useState<Status>("vill-se");
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [mType, setMType] = useState<MovieType>("film");
  const [mStatus, setMStatus] = useState<Status>("vill-se");

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(KEY);
    if (saved) try { setMovies(JSON.parse(saved)); } catch { /* */ }
  }, []);

  if (!mounted) return <GlassCard className="flex items-center justify-center"><div className="h-6 w-24 rounded bg-separator animate-pulse" /></GlassCard>;

  function save(m: Movie[]) { setMovies(m); localStorage.setItem(KEY, JSON.stringify(m)); }

  function addMovie() {
    if (!title.trim()) return;
    const m: Movie = { id: Date.now().toString(), title: title.trim(), type: mType, status: mStatus };
    if (year.trim()) m.year = parseInt(year);
    save([...movies, m]);
    setTitle(""); setYear(""); setShowAdd(false);
  }

  function removeMovie(id: string) { save(movies.filter(m => m.id !== id)); }

  function setRating(id: string, rating: number) {
    save(movies.map(m => m.id === id ? { ...m, rating: m.rating === rating ? undefined : rating } : m));
  }

  const filtered = movies.filter(m => m.status === tab);

  return (
    <GlassCard className="flex flex-col h-[280px] p-3 gap-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Film size={16} className="text-accent" />
          <span className="text-sm font-semibold text-foreground">Film & Serier</span>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-ghost p-1 rounded">
          {showAdd ? <X size={14} /> : <Plus size={14} />}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        {TABS.map(t => {
          const count = movies.filter(m => m.status === t.key).length;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 text-[11px] py-1 rounded transition-all ${tab === t.key ? "bg-surface text-accent font-semibold" : "text-fg-tertiary hover:text-fg-secondary"}`}>
              {t.label} {count > 0 && <span className="text-[9px] opacity-60">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Titel..."
              className="input-base text-xs flex-1 px-2 py-1" onKeyDown={e => e.key === "Enter" && addMovie()} />
            <input value={year} onChange={e => setYear(e.target.value)} placeholder="Ar" type="number"
              className="input-base text-xs w-14 px-1 py-1" />
          </div>
          <div className="flex gap-1 items-center">
            <div className="flex gap-0.5">
              {(["film", "serie"] as MovieType[]).map(t => (
                <button key={t} onClick={() => setMType(t)}
                  className={`text-[10px] px-2 py-0.5 rounded ${mType === t ? "btn-primary" : "btn-ghost"}`}>
                  {t === "film" ? "Film" : "Serie"}
                </button>
              ))}
            </div>
            <select value={mStatus} onChange={e => setMStatus(e.target.value as Status)} className="input-base text-xs px-1 py-0.5 flex-1">
              {TABS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
            <button onClick={addMovie} className="btn-primary text-xs px-2 py-0.5 rounded">+</button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-fg-tertiary text-xs">
            <Film size={20} className="mb-1 opacity-40" />
            {tab === "vill-se" ? "Lagg till filmer du vill se" : tab === "tittar" ? "Inget pa gang just nu" : "Inga betygsatta annu"}
          </div>
        ) : (
          filtered.map(m => (
            <div key={m.id} className="flex items-center justify-between bg-surface rounded px-2 py-1 group">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                {m.type === "film" ? <Film size={11} className="text-fg-tertiary shrink-0" /> : <Tv size={11} className="text-fg-tertiary shrink-0" />}
                <span className="text-xs text-foreground truncate">{m.title}</span>
                {m.year && <span className="text-[9px] text-fg-tertiary shrink-0">{m.year}</span>}
                <span className={`text-[8px] px-1 rounded shrink-0 ${m.type === "film" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"}`}>
                  {m.type === "film" ? "Film" : "Serie"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {tab === "sett" && (
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button key={s} onClick={() => setRating(m.id, s)} className="p-0">
                        <Star size={11} className={s <= (m.rating || 0) ? "fill-amber-400 text-amber-400" : "text-fg-tertiary"} />
                      </button>
                    ))}
                  </div>
                )}
                <button onClick={() => removeMovie(m.id)} className="btn-ghost p-0.5 rounded opacity-0 group-hover:opacity-100">
                  <X size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </GlassCard>
  );
}

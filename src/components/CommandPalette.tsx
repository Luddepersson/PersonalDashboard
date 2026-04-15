"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, LayoutDashboard, CalendarDays, Link2, ListTodo, GitBranch, Target, Timer, Music, FileText, Users, User, Command, BarChart3, Columns3 } from "lucide-react";

interface CommandItem { id: string; label: string; href: string; icon: React.ReactNode; }

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const commands: CommandItem[] = useMemo(() => [
    { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={15} /> },
    { id: "pomodoro", label: "Pomodoro", href: "/pomodoro", icon: <Timer size={15} /> },
    { id: "calendar", label: "Kalender", href: "/calendar", icon: <CalendarDays size={15} /> },
    { id: "todos", label: "Uppgifter", href: "/todos", icon: <ListTodo size={15} /> },
    { id: "notes", label: "Anteckningar", href: "/notes", icon: <FileText size={15} /> },
    { id: "habits", label: "Vanor", href: "/habits", icon: <Target size={15} /> },
    { id: "github", label: "GitHub", href: "/github", icon: <GitBranch size={15} /> },
    { id: "music", label: "Musik", href: "/music", icon: <Music size={15} /> },
    { id: "links", label: "Snabblänkar", href: "/links", icon: <Link2 size={15} /> },
    { id: "kanban", label: "Kanban", href: "/kanban", icon: <Columns3 size={15} /> },
    { id: "analytics", label: "Statistik", href: "/analytics", icon: <BarChart3 size={15} /> },
    { id: "teams", label: "Teams", href: "/teams", icon: <Users size={15} /> },
    { id: "profile", label: "Profil", href: "/profile", icon: <User size={15} /> },
  ], []);

  const filtered = useMemo(() => query ? commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase())) : commands, [query, commands]);

  const handleGlobalKey = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen((p) => !p); setQuery(""); setSelectedIndex(0); }
    if (e.key === "Escape") setOpen(false);
  }, []);

  useEffect(() => { window.addEventListener("keydown", handleGlobalKey); return () => window.removeEventListener("keydown", handleGlobalKey); }, [handleGlobalKey]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50); }, [open]);
  useEffect(() => { setSelectedIndex(0); }, [query]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && filtered[selectedIndex]) { router.push(filtered[selectedIndex].href); setOpen(false); }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[18vh]">
      <div className="absolute inset-0 bg-[#1a2b3c]/15 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-md mx-2 sm:mx-4 rounded-2xl bg-white/70 backdrop-blur-2xl border border-white/50 shadow-[0_16px_64px_rgba(56,163,201,0.12)] overflow-hidden animate-in" role="dialog" aria-label="Sök sidor">
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#a8d4e6]/15">
          <Search size={16} className="text-accent/50 shrink-0" />
          <input ref={inputRef} type="text" placeholder="Sök sidor..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKeyDown} className="flex-1 bg-transparent text-sm text-[#1a2b3c] placeholder-[#1a2b3c]/30 focus:outline-none py-1" aria-label="Sök sidor" />
          <kbd className="hidden sm:block px-2 py-0.5 rounded-md text-[10px] text-[#1a2b3c]/25 bg-[#a8d4e6]/10 font-mono">esc</kbd>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2">
          {filtered.length === 0 && <p className="text-sm text-fg-tertiary text-center py-8">Inga resultat</p>}
          {filtered.map((cmd, i) => (
            <button key={cmd.id} onClick={() => { router.push(cmd.href); setOpen(false); }} onMouseEnter={() => setSelectedIndex(i)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${selectedIndex === i ? "bg-accent-subtle text-accent" : "text-[#1a2b3c]/60 hover:bg-accent-subtle/50"}`}>
              <div className={selectedIndex === i ? "text-accent" : "text-[#1a2b3c]/25"}>{cmd.icon}</div>
              <span className="text-sm">{cmd.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CommandPaletteHint() {
  return (
    <button onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }))}
      className="focus-ring flex items-center gap-2 px-3 py-2 rounded-xl bg-white/40 backdrop-blur border border-white/40 text-fg-tertiary hover:text-accent hover:bg-white/60 hover:border-accent/20 transition-all text-xs shadow-sm">
      <Search size={13} />
      <span className="hidden sm:inline">Sök</span>
      <kbd className="flex items-center gap-0.5 text-[10px] ml-1.5 opacity-50"><Command size={10} />K</kbd>
    </button>
  );
}

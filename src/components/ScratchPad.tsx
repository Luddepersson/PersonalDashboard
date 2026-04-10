"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import GlassCard from "./GlassCard";

const KEY = "dashboard-scratch";
const SAVE_KEY = "dashboard-scratch-saved";

export default function ScratchPad() {
  const [mounted, setMounted] = useState(false);
  const [text, setText] = useState("");
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setMounted(true);
    try {
      const s = localStorage.getItem(KEY);
      if (s) setText(s);
      const ts = localStorage.getItem(SAVE_KEY);
      if (ts) setLastSaved(ts);
    } catch {}
  }, []);

  const saveToStorage = useCallback((val: string) => {
    localStorage.setItem(KEY, val);
    const ts = new Date().toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
    localStorage.setItem(SAVE_KEY, ts);
    setLastSaved(ts);
  }, []);

  function handleChange(val: string) {
    setText(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => saveToStorage(val), 500);
  }

  if (!mounted) return <GlassCard className="flex items-center justify-center"><div className="h-6 w-24 rounded bg-separator animate-pulse" /></GlassCard>;

  return (
    <GlassCard className="flex flex-col h-[280px]">
      <p className="text-xs font-medium text-fg-secondary uppercase tracking-wider mb-2">Anteckningar</p>
      <div className="flex-1 rounded-lg overflow-hidden" style={{ background: "rgba(255, 249, 230, 0.06)" }}>
        <textarea
          value={text}
          onChange={e => handleChange(e.target.value)}
          placeholder="Skriv snabba tankar här..."
          className="w-full h-full resize-none bg-transparent text-foreground text-xs p-2 outline-none placeholder:text-fg-tertiary/60"
          style={{ minHeight: 0 }}
        />
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[9px] text-fg-tertiary">
          {lastSaved ? `Sparad ${lastSaved}` : ""}
        </span>
        <span className="text-[9px] text-fg-tertiary">{text.length} tecken</span>
      </div>
    </GlassCard>
  );
}

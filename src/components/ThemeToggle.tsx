"use client";

import { useState, useRef, useEffect } from "react";
import { Palette } from "lucide-react";
import { useTheme, THEMES, type ThemeId } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, setThemeById } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="focus-ring p-2 rounded-xl bg-white/10 backdrop-blur border border-white/10 text-[var(--foreground-secondary)] hover:text-[var(--accent)] hover:bg-white/15 hover:border-[var(--accent)]/20 transition-all shadow-sm"
        aria-label="Byt tema"
      >
        <Palette size={15} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[220px] p-3 rounded-2xl backdrop-blur-3xl border shadow-[0_16px_48px_rgba(0,0,0,0.2)] animate-in z-50"
          style={{ background: "var(--glass-bg)", borderColor: "var(--glass-border)" }}
        >
          <p className="text-xs font-semibold mb-2.5 px-1" style={{ color: "var(--foreground-secondary)" }}>Välj tema</p>
          <div className="space-y-1.5">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => { setThemeById(t.id); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 p-2 rounded-xl transition-all ${
                  theme.id === t.id ? "ring-2" : "hover:bg-white/5"
                }`}
                style={theme.id === t.id ? { outline: `2px solid ${t.accent}`, outlineOffset: "-2px", background: `${t.accent}15` } : {}}
              >
                {/* Color preview swatch */}
                <div
                  className="w-8 h-8 rounded-lg shrink-0 shadow-sm border border-white/10"
                  style={{ background: t.bg }}
                />
                <div className="text-left min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: theme.id === t.id ? t.accent : "var(--foreground)" }}>
                    {t.name}
                  </p>
                </div>
                {theme.id === t.id && (
                  <div className="ml-auto w-2 h-2 rounded-full shrink-0" style={{ background: t.accent }} />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

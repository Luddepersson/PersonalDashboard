"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme, THEMES, type ThemeId } from "@/components/ThemeProvider";

const STORAGE_KEY = "dashboard-auto-theme";

function getThemeForHour(hour: number): ThemeId {
  if (hour >= 6 && hour < 12) return "navy-mirage";
  if (hour >= 12 && hour < 17) return "emerald-chrome";
  if (hour >= 17 && hour < 21) return "midnight-gold";
  return "obsidian-plum";
}

export default function AutoTheme() {
  const { theme, setThemeById } = useTheme();
  const [enabled, setEnabled] = useState(false);

  // Load preference from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "true") {
        setEnabled(true);
      }
    } catch {}
  }, []);

  // Apply theme by time when enabled, check every minute
  const applyTimeTheme = useCallback(() => {
    const hour = new Date().getHours();
    const target = getThemeForHour(hour);
    if (theme.id !== target) {
      setThemeById(target);
    }
  }, [theme.id, setThemeById]);

  useEffect(() => {
    if (!enabled) return;

    // Apply immediately
    applyTimeTheme();

    // Check every 60 seconds
    const id = setInterval(applyTimeTheme, 60000);
    return () => clearInterval(id);
  }, [enabled, applyTimeTheme]);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem(STORAGE_KEY, String(next));
    if (next) {
      const hour = new Date().getHours();
      setThemeById(getThemeForHour(hour));
    }
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-3 w-full"
      role="switch"
      aria-checked={enabled}
    >
      <div
        className={`relative w-10 h-[22px] rounded-full transition-colors ${
          enabled ? "bg-accent" : "bg-separator"
        }`}
      >
        <div
          className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-transform ${
            enabled ? "left-[22px]" : "left-[3px]"
          }`}
        />
      </div>
      <div className="text-left">
        <span className="text-sm text-foreground font-medium">Auto-tema</span>
        <p className="text-[11px] text-fg-tertiary">
          {enabled
            ? `Aktivt — ${THEMES.find((t) => t.id === getThemeForHour(new Date().getHours()))?.name}`
            : "Byt tema automatiskt efter tid på dygnet"}
        </p>
      </div>
    </button>
  );
}

"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export type ThemeId = "emerald-chrome" | "navy-mirage" | "midnight-gold" | "royal-aurora" | "obsidian-plum";

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  bg: string;       // CSS background gradient
  surface: string;
  surfaceEl: string;
  fg: string;
  fgSec: string;
  fgTer: string;
  sep: string;
  accent: string;
  accentHover: string;
  accentSubtle: string;
  accentSec: string;
  accentWarm: string;
  glassBg: string;
  glassBorder: string;
  glassShadow: string;
  glassShine: string;
  sidebarBg: string;
}

export const THEMES: ThemeConfig[] = [
  {
    id: "emerald-chrome",
    name: "Emerald Chrome",
    bg: "linear-gradient(135deg, #010528 0%, #012a3a 40%, #004B8E 100%)",
    surface: "rgba(0, 75, 142, 0.2)",
    surfaceEl: "rgba(1, 42, 58, 0.7)",
    fg: "#f0f6ff",
    fgSec: "rgba(240, 246, 255, 0.75)",
    fgTer: "rgba(240, 246, 255, 0.45)",
    sep: "rgba(240, 246, 255, 0.1)",
    accent: "#00b4d8",
    accentHover: "#00cfff",
    accentSubtle: "rgba(0, 180, 216, 0.15)",
    accentSec: "#0096c7",
    accentWarm: "#48cae4",
    glassBg: "rgba(5, 35, 60, 0.65)",
    glassBorder: "rgba(0, 180, 216, 0.18)",
    glassShadow: "rgba(0, 0, 0, 0.3)",
    glassShine: "rgba(255, 255, 255, 0.08)",
    sidebarBg: "rgba(2, 20, 42, 0.75)",
  },
  {
    id: "navy-mirage",
    name: "Navy Mirage",
    bg: "linear-gradient(135deg, #141E30 0%, #1a2942 40%, #3F5E96 100%)",
    surface: "rgba(63, 94, 150, 0.18)",
    surfaceEl: "rgba(26, 41, 66, 0.7)",
    fg: "#eaf0f8",
    fgSec: "rgba(234, 240, 248, 0.75)",
    fgTer: "rgba(234, 240, 248, 0.45)",
    sep: "rgba(234, 240, 248, 0.1)",
    accent: "#6d9dd1",
    accentHover: "#8ab4e2",
    accentSubtle: "rgba(109, 157, 209, 0.15)",
    accentSec: "#4a7db8",
    accentWarm: "#8faec8",
    glassBg: "rgba(18, 28, 48, 0.65)",
    glassBorder: "rgba(109, 157, 209, 0.16)",
    glassShadow: "rgba(0, 0, 0, 0.25)",
    glassShine: "rgba(255, 255, 255, 0.07)",
    sidebarBg: "rgba(18, 28, 46, 0.8)",
  },
  {
    id: "midnight-gold",
    name: "Midnight Gold",
    bg: "linear-gradient(135deg, #1A1A1A 0%, #2a2518 40%, #B3945B 100%)",
    surface: "rgba(179, 148, 91, 0.12)",
    surfaceEl: "rgba(42, 37, 24, 0.7)",
    fg: "#f8f0e0",
    fgSec: "rgba(248, 240, 224, 0.75)",
    fgTer: "rgba(248, 240, 224, 0.45)",
    sep: "rgba(248, 240, 224, 0.1)",
    accent: "#d4a856",
    accentHover: "#e4be72",
    accentSubtle: "rgba(212, 168, 86, 0.15)",
    accentSec: "#b08a3e",
    accentWarm: "#c9975a",
    glassBg: "rgba(26, 24, 20, 0.65)",
    glassBorder: "rgba(212, 168, 86, 0.16)",
    glassShadow: "rgba(0, 0, 0, 0.3)",
    glassShine: "rgba(212, 168, 86, 0.08)",
    sidebarBg: "rgba(24, 22, 18, 0.8)",
  },
  {
    id: "royal-aurora",
    name: "Royal Aurora",
    bg: "linear-gradient(135deg, #3E2F5B 0%, #6a3a5a 40%, #E94560 100%)",
    surface: "rgba(233, 69, 96, 0.12)",
    surfaceEl: "rgba(62, 47, 91, 0.7)",
    fg: "#fce8ee",
    fgSec: "rgba(252, 232, 238, 0.75)",
    fgTer: "rgba(252, 232, 238, 0.45)",
    sep: "rgba(252, 232, 238, 0.1)",
    accent: "#e94560",
    accentHover: "#ff6080",
    accentSubtle: "rgba(233, 69, 96, 0.15)",
    accentSec: "#c93a52",
    accentWarm: "#ff7a8a",
    glassBg: "rgba(55, 40, 75, 0.65)",
    glassBorder: "rgba(233, 69, 96, 0.16)",
    glassShadow: "rgba(0, 0, 0, 0.25)",
    glassShine: "rgba(255, 255, 255, 0.07)",
    sidebarBg: "rgba(48, 35, 68, 0.8)",
  },
  {
    id: "obsidian-plum",
    name: "Obsidian Plum",
    bg: "linear-gradient(135deg, #2D1E2F 0%, #3a2540 40%, #4E2A4F 100%)",
    surface: "rgba(78, 42, 79, 0.18)",
    surfaceEl: "rgba(58, 37, 64, 0.7)",
    fg: "#f2e4f4",
    fgSec: "rgba(242, 228, 244, 0.75)",
    fgTer: "rgba(242, 228, 244, 0.45)",
    sep: "rgba(242, 228, 244, 0.1)",
    accent: "#b06ab3",
    accentHover: "#cc85cf",
    accentSubtle: "rgba(176, 106, 179, 0.15)",
    accentSec: "#8a4a8d",
    accentWarm: "#d88ada",
    glassBg: "rgba(42, 28, 45, 0.65)",
    glassBorder: "rgba(176, 106, 179, 0.16)",
    glassShadow: "rgba(0, 0, 0, 0.25)",
    glassShine: "rgba(255, 255, 255, 0.06)",
    sidebarBg: "rgba(40, 26, 42, 0.8)",
  },
];

interface ThemeContextValue {
  theme: ThemeConfig;
  setThemeById: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: THEMES[0],
  setThemeById: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function applyTheme(t: ThemeConfig) {
  const root = document.documentElement;
  root.style.setProperty("--background", "transparent");
  root.style.setProperty("--surface", t.surface);
  root.style.setProperty("--surface-elevated", t.surfaceEl);
  root.style.setProperty("--foreground", t.fg);
  root.style.setProperty("--foreground-secondary", t.fgSec);
  root.style.setProperty("--foreground-tertiary", t.fgTer);
  root.style.setProperty("--separator", t.sep);
  root.style.setProperty("--accent", t.accent);
  root.style.setProperty("--accent-hover", t.accentHover);
  root.style.setProperty("--accent-subtle", t.accentSubtle);
  root.style.setProperty("--accent-secondary", t.accentSec);
  root.style.setProperty("--accent-warm", t.accentWarm);
  root.style.setProperty("--glass-bg", t.glassBg);
  root.style.setProperty("--glass-border", t.glassBorder);
  root.style.setProperty("--glass-shadow", t.glassShadow);
  root.style.setProperty("--glass-shine", t.glassShine);
  root.style.setProperty("--sidebar-bg", t.sidebarBg);
  root.setAttribute("data-theme", t.id);
  document.body.style.background = t.bg;
}

export function ThemeProvider({ children, defaultTheme }: { children: ReactNode; defaultTheme?: string }) {
  const [theme, setTheme] = useState<ThemeConfig>(
    THEMES.find((t) => t.id === defaultTheme) || THEMES[0]
  );

  useEffect(() => {
    // Check localStorage first
    const saved = localStorage.getItem("dashboard-theme-id");
    const found = THEMES.find((t) => t.id === saved);
    if (found) {
      setTheme(found);
      applyTheme(found);
    } else {
      applyTheme(theme);
    }
  }, []);

  const setThemeById = useCallback((id: ThemeId) => {
    const found = THEMES.find((t) => t.id === id);
    if (!found) return;
    setTheme(found);
    applyTheme(found);
    localStorage.setItem("dashboard-theme-id", id);
    // Also persist to Supabase
    fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: id }),
    }).catch(() => {});
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setThemeById }}>
      {children}
    </ThemeContext.Provider>
  );
}

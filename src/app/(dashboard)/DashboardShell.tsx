"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import CommandPalette, { CommandPaletteHint } from "@/components/CommandPalette";
import ParticlesBackground from "@/components/ParticlesBackground";
import ThemeToggle from "@/components/ThemeToggle";
import { ThemeProvider } from "@/components/ThemeProvider";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import SleepMode from "@/components/sleep/SleepMode";
import FocusMode from "@/components/focus/FocusMode";
import NotificationBell from "@/components/notifications/NotificationBell";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
import { JarvisFloating } from "@/components/AIAssistant";
import CastButton from "@/components/CastButton";
import { useBackgroundImage } from "@/components/BackgroundSelector";
import { Moon, Crosshair, HelpCircle } from "lucide-react";
import { type ReactNode } from "react";

interface Props {
  children: ReactNode;
  user?: { name?: string | null; theme?: string | null };
}

export default function DashboardShell({ children, user }: Props) {
  const [sleepMode, setSleepMode] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const bgImage = useBackgroundImage();

  // Global keyboard shortcuts
  const handleGlobalKeys = useCallback((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if (e.metaKey || e.ctrlKey) return;

    switch (e.key) {
      case "s": e.preventDefault(); setSleepMode(true); break;
      case "f": e.preventDefault(); setFocusMode(true); break;
      case "?": e.preventDefault(); setShowShortcuts(true); break;
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleGlobalKeys);
    return () => window.removeEventListener("keydown", handleGlobalKeys);
  }, [handleGlobalKeys]);

  return (
    <ThemeProvider defaultTheme={user?.theme || "emerald-chrome"}>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[999] focus:px-4 focus:py-2 focus:rounded-xl focus:bg-accent focus:text-white focus:text-sm">
        Gå till huvudinnehåll
      </a>
      <ServiceWorkerRegistrar />
      <ParticlesBackground />

      {/* Background image overlay */}
      {bgImage && (
        <div
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
          style={{
            backgroundImage: `url(${bgImage})`,
            opacity: 0.18,
          }}
        />
      )}

      {/* Sleep Mode */}
      <SleepMode isActive={sleepMode} onExit={() => setSleepMode(false)} />

      {/* Focus Mode */}
      <FocusMode isActive={focusMode} onExit={() => setFocusMode(false)} />

      {/* Keyboard Shortcuts Guide */}
      <KeyboardShortcuts isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />

      {/* Jarvis — floating AI assistant */}
      <JarvisFloating />

      <div className="bg-mesh min-h-screen overflow-x-hidden">
        <Sidebar userName={user?.name || undefined} />
        <CommandPalette />

        <main id="main-content" className="ml-0 lg:ml-[230px] transition-all duration-300 min-h-screen px-2 pt-14 pb-4 sm:px-5 sm:pt-16 sm:pb-6 lg:pt-5 lg:px-7 lg:pb-8">
          {/* Top bar — responsive: wraps on mobile */}
          <div className="relative flex items-center justify-end gap-1 sm:gap-1.5 mb-3 sm:mb-5 flex-wrap z-20">
            <button onClick={() => setFocusMode(true)} className="btn-ghost p-1.5 sm:p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg sm:rounded-xl text-fg-tertiary hover:text-accent" title="Fokusläge (F)" aria-label="Fokusläge">
              <Crosshair size={15} />
            </button>
            <button onClick={() => setSleepMode(true)} className="btn-ghost p-1.5 sm:p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg sm:rounded-xl text-fg-tertiary hover:text-accent" title="Viloläge (S)" aria-label="Viloläge">
              <Moon size={15} />
            </button>
            <CastButton />
            <button onClick={() => setShowShortcuts(true)} className="hidden sm:flex btn-ghost p-2 min-w-[44px] min-h-[44px] items-center justify-center rounded-xl text-fg-tertiary hover:text-accent" title="Genvägar (?)" aria-label="Hjälp och genvägar">
              <HelpCircle size={15} />
            </button>
            <NotificationBell />
            <div className="hidden sm:block"><CommandPaletteHint /></div>
            <ThemeToggle />
          </div>

          {children}
        </main>
      </div>
    </ThemeProvider>
  );
}

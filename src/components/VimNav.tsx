"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";

interface VimNavProps {
  children: ReactNode;
}

const GO_MAPPINGS: Record<string, string> = {
  d: "/dashboard",
  t: "/teams",
  c: "/calendar",
  n: "/notes",
  k: "/kanban",
  p: "/pomodoro",
  h: "/habits",
  g: "/github",
  m: "/music",
  l: "/links",
  a: "/analytics",
  o: "/todos",
};

export default function VimNav({ children }: VimNavProps) {
  const [focusIndex, setFocusIndex] = useState(-1);
  const [waitingG, setWaitingG] = useState(false);
  const router = useRouter();

  const getWidgets = useCallback((): HTMLElement[] => {
    return Array.from(document.querySelectorAll("[data-vim-widget]"));
  }, []);

  const clearFocus = useCallback(() => {
    setFocusIndex(-1);
    document.querySelectorAll("[data-vim-widget]").forEach((el) => {
      (el as HTMLElement).style.removeProperty("box-shadow");
    });
  }, []);

  const applyFocus = useCallback((index: number) => {
    const widgets = getWidgets();
    // Clear all
    widgets.forEach((el) => el.style.removeProperty("box-shadow"));

    if (index >= 0 && index < widgets.length) {
      const el = widgets[index];
      el.style.boxShadow = "0 0 0 2px var(--accent), 0 0 12px var(--accent-subtle)";
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [getWidgets]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const widgets = getWidgets();
      const count = widgets.length;
      if (count === 0 && e.key !== "/" && e.key !== "g") return;

      // Handle "g then X" combos
      if (waitingG) {
        setWaitingG(false);
        const dest = GO_MAPPINGS[e.key];
        if (dest) {
          e.preventDefault();
          clearFocus();
          router.push(dest);
        }
        return;
      }

      switch (e.key) {
        case "j": {
          e.preventDefault();
          const next = focusIndex < count - 1 ? focusIndex + 1 : 0;
          setFocusIndex(next);
          applyFocus(next);
          break;
        }
        case "k": {
          e.preventDefault();
          const prev = focusIndex > 0 ? focusIndex - 1 : count - 1;
          setFocusIndex(prev);
          applyFocus(prev);
          break;
        }
        case "Enter": {
          if (focusIndex >= 0 && focusIndex < count) {
            e.preventDefault();
            widgets[focusIndex].scrollIntoView({ behavior: "smooth", block: "center" });
            // Click the widget if it has a primary action
            const action = widgets[focusIndex].querySelector("a, button");
            if (action) (action as HTMLElement).click();
          }
          break;
        }
        case "Escape": {
          clearFocus();
          break;
        }
        case "/": {
          e.preventDefault();
          clearFocus();
          // Trigger command palette (Cmd+K / Ctrl+K)
          window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
          break;
        }
        case "g": {
          e.preventDefault();
          setWaitingG(true);
          // Reset after 1.5s if no follow-up
          setTimeout(() => setWaitingG(false), 1500);
          break;
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [focusIndex, waitingG, getWidgets, applyFocus, clearFocus, router]);

  // Clean up focus ring on unmount
  useEffect(() => {
    return () => clearFocus();
  }, [clearFocus]);

  return (
    <>
      {waitingG && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] px-3 py-1.5 rounded-lg bg-surface-elevated text-fg-secondary text-xs font-mono border border-separator shadow-lg">
          g → <span className="text-accent">d</span>ashboard{" "}
          <span className="text-accent">t</span>eams{" "}
          <span className="text-accent">c</span>alendar{" "}
          <span className="text-accent">n</span>otes{" "}
          <span className="text-accent">k</span>anban ...
        </div>
      )}
      {children}
    </>
  );
}

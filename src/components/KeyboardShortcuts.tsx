"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: "⌘K", description: "Sök" },
  { key: "N", description: "Ny uppgift" },
  { key: "P", description: "Starta/pausa pomodoro" },
  { key: "F", description: "Fokusläge" },
  { key: "S", description: "Viloläge" },
  { key: "?", description: "Visa genvägar" },
  { key: "Esc", description: "Stäng" },
];

export default function KeyboardShortcuts({
  isOpen,
  onClose,
}: KeyboardShortcutsProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="bg-white/15 backdrop-blur-3xl border border-white/25 rounded-2xl p-6 w-full max-w-sm shadow-2xl pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-foreground">
                  Tangentbordsgenvägar
                </h2>
                <button
                  onClick={onClose}
                  className="px-2 py-1 rounded-lg bg-white/10 border border-white/20 text-xs font-mono text-fg-secondary hover:bg-white/20 transition-colors"
                >
                  Esc
                </button>
              </div>

              <div className="space-y-2">
                {SHORTCUTS.map((shortcut) => (
                  <div
                    key={shortcut.key}
                    className="flex items-center justify-between py-2 px-1"
                  >
                    <kbd className="px-2 py-1 rounded-lg bg-white/10 border border-white/20 text-xs font-mono text-fg-secondary">
                      {shortcut.key}
                    </kbd>
                    <span className="text-sm text-fg-secondary">
                      {shortcut.description}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t border-white/10">
                <p className="text-[11px] text-fg-tertiary text-center">
                  Tryck <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-[10px] font-mono">?</kbd> för att visa/dölja
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

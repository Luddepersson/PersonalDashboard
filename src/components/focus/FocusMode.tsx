"use client";

import { useState, useEffect } from "react";
import { X, Target } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import PomodoroWidget from "../PomodoroWidget";

interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

interface FocusModeProps {
  isActive: boolean;
  onExit: () => void;
}

export default function FocusMode({ isActive, onExit }: FocusModeProps) {
  const [currentTask, setCurrentTask] = useState<TodoItem | null>(null);

  useEffect(() => {
    if (!isActive) return;
    try {
      const saved = localStorage.getItem("dashboard-todos");
      if (saved) {
        const todos: TodoItem[] = JSON.parse(saved);
        const top = todos.find((t) => !t.done) ?? null;
        setCurrentTask(top);
      }
    } catch {
      /* */
    }
  }, [isActive]);

  // Lock body scroll when active
  useEffect(() => {
    if (isActive) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isActive]);

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="fixed inset-0 z-[150] flex items-center justify-center"
        >
          {/* Frosted backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-2xl" />

          {/* Exit button */}
          <button
            onClick={onExit}
            className="absolute top-6 right-6 z-10 btn-ghost flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-fg-secondary hover:text-foreground transition-colors bg-white/10 backdrop-blur-xl border border-white/15"
          >
            <X size={14} />
            <span>Avsluta fokusläge</span>
          </button>

          {/* Centered content */}
          <div className="relative z-10 w-full max-w-md px-4 space-y-6">
            {/* Current task */}
            {currentTask && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.3 }}
                className="bg-white/15 backdrop-blur-3xl border border-white/25 rounded-2xl p-5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Target size={14} className="text-accent" />
                  <span className="text-[11px] font-medium text-fg-secondary uppercase tracking-wider">
                    Aktuell uppgift
                  </span>
                </div>
                <p className="text-lg font-medium text-foreground">
                  {currentTask.text}
                </p>
              </motion.div>
            )}

            {/* Pomodoro timer */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.3 }}
            >
              <PomodoroWidget />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

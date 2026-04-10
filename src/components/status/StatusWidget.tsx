"use client";

import { useState, useEffect, useCallback } from "react";
import GlassCard from "@/components/GlassCard";

interface StatusData {
  status: string;
  emoji: string;
  updatedAt: string;
}

const PRESET_STATUSES: { label: string; emoji: string }[] = [
  { label: "Tillgänglig", emoji: "🟢" },
  { label: "I möte", emoji: "🔴" },
  { label: "Fokusläge", emoji: "🟡" },
  { label: "Lunch", emoji: "🍽️" },
  { label: "Borta", emoji: "⚫" },
];

const STORAGE_KEY = "dashboard-status";

function getStoredStatus(): StatusData {
  if (typeof window === "undefined") return { status: "Tillgänglig", emoji: "🟢", updatedAt: new Date().toISOString() };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { status: "Tillgänglig", emoji: "🟢", updatedAt: new Date().toISOString() };
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just nu";
  if (mins < 60) return `${mins} min sedan`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} tim sedan`;
  return `${Math.floor(hours / 24)} dag sedan`;
}

export default function StatusWidget() {
  const [data, setData] = useState<StatusData>(getStoredStatus);
  const [showPicker, setShowPicker] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [, setTick] = useState(0);

  // Refresh "time ago" every 30s
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const applyStatus = useCallback((status: string, emoji: string) => {
    const next: StatusData = { status, emoji, updatedAt: new Date().toISOString() };
    setData(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setShowPicker(false);
    setCustomInput("");

    // Fire-and-forget API call
    fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => {});
  }, []);

  const handleCustomSubmit = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    applyStatus(trimmed, "💬");
  };

  return (
    <GlassCard className="p-4">
      <h3 className="text-xs font-semibold text-fg-tertiary uppercase tracking-wider mb-3">
        Status
      </h3>

      {/* Current status */}
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface hover:bg-separator/30 transition-colors cursor-pointer"
      >
        <span className="text-2xl">{data.emoji}</span>
        <div className="text-left flex-1 min-w-0">
          <p className="text-foreground font-medium text-sm truncate">{data.status}</p>
          <p className="text-fg-tertiary text-[11px]">
            Senast uppdaterad: {timeAgo(data.updatedAt)}
          </p>
        </div>
        <span className="text-fg-tertiary text-xs">{showPicker ? "▲" : "▼"}</span>
      </button>

      {/* Picker */}
      {showPicker && (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {PRESET_STATUSES.map((p) => {
              const isActive = data.status === p.label;
              return (
                <button
                  key={p.label}
                  onClick={() => applyStatus(p.label, p.emoji)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-accent/20 text-accent ring-1 ring-accent/40"
                      : "bg-surface text-fg-secondary hover:bg-separator/30 hover:text-foreground"
                  }`}
                >
                  <span>{p.emoji}</span>
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>

          {/* Custom status */}
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit()}
              placeholder="Egen status..."
              className="input-base flex-1 text-sm px-3 py-1.5 rounded-lg"
            />
            <button
              onClick={handleCustomSubmit}
              disabled={!customInput.trim()}
              className="btn-primary px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40"
            >
              Spara
            </button>
          </div>
        </div>
      )}
    </GlassCard>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Download, Upload } from "lucide-react";
import GlassCard from "./GlassCard";

const STORAGE_KEYS = [
  "dashboard-todos",
  "dashboard-habits",
  "dashboard-reminders",
  "dashboard-md-notes",
  "quick-links",
  "pomodoro-count",
  "dashboard-playlist",
  "github-username",
  "dashboard-widgets",
];

const LAST_EXPORT_KEY = "dashboard-last-export";

export default function ExportImport() {
  const [mounted, setMounted] = useState(false);
  const [lastExport, setLastExport] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setLastExport(localStorage.getItem(LAST_EXPORT_KEY));
  }, []);

  function handleExport() {
    const data: Record<string, unknown> = {};
    for (const key of STORAGE_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        try {
          data[key] = JSON.parse(raw);
        } catch {
          data[key] = raw;
        }
      }
    }

    const today = new Date().toISOString().split("T")[0];
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dashboard-export-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);

    localStorage.setItem(LAST_EXPORT_KEY, today);
    setLastExport(today);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (typeof data !== "object" || data === null) {
          alert("Ogiltig fil: förväntar ett JSON-objekt.");
          return;
        }
        for (const [key, value] of Object.entries(data)) {
          localStorage.setItem(
            key,
            typeof value === "string" ? value : JSON.stringify(value)
          );
        }
        window.location.reload();
      } catch {
        alert("Kunde inte läsa filen. Kontrollera att det är giltig JSON.");
      }
    };
    reader.readAsText(file);
  }

  if (!mounted) {
    return (
      <GlassCard className="min-h-[100px] flex items-center justify-center">
        <div className="h-8 w-28 rounded bg-separator animate-pulse" />
      </GlassCard>
    );
  }

  return (
    <GlassCard hover3d={false}>
      <h2
        className="text-lg font-semibold mb-3"
        style={{ color: "var(--text-primary)" }}
      >
        Data
      </h2>

      <div className="flex flex-wrap gap-3 items-center">
        {/* Export */}
        <button
          onClick={handleExport}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors hover:opacity-80"
          style={{
            background: "rgba(46,148,190,0.15)",
            color: "var(--text-primary)",
            border: "1px solid var(--glass-border)",
          }}
        >
          <Download size={16} />
          Exportera data
        </button>

        {/* Import */}
        <label
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors hover:opacity-80 cursor-pointer"
          style={{
            background: "rgba(46,148,190,0.15)",
            color: "var(--text-primary)",
            border: "1px solid var(--glass-border)",
          }}
        >
          <Upload size={16} />
          Importera data
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </label>
      </div>

      {lastExport && (
        <p
          className="text-xs mt-3"
          style={{ color: "var(--text-secondary)" }}
        >
          Senaste export: {lastExport}
        </p>
      )}
    </GlassCard>
  );
}

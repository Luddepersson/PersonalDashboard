"use client";

import { useState, useEffect } from "react";
import { Share2, Copy, Check, ExternalLink, Eye, EyeOff, ToggleLeft, ToggleRight } from "lucide-react";
import GlassCard from "./GlassCard";

interface ShareConfig {
  enabled: boolean;
  token: string;
  widgets: string[];
}

const STORAGE_KEY = "dashboard-share";

const AVAILABLE_WIDGETS = [
  { id: "clock", label: "Klocka" },
  { id: "weather", label: "Vader" },
  { id: "calendar", label: "Kalender" },
  { id: "todos", label: "Uppgifter" },
  { id: "notes", label: "Anteckningar" },
  { id: "bookmarks", label: "Favoriter" },
  { id: "habits", label: "Vanor" },
  { id: "pomodoro", label: "Pomodoro" },
  { id: "github", label: "GitHub" },
  { id: "spotify", label: "Spotify" },
  { id: "workhours", label: "Arbetstid" },
  { id: "files", label: "Filer" },
  { id: "webhooks", label: "Webhooks" },
];

function generateToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 24; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

export default function ShareDashboard() {
  const [mounted, setMounted] = useState(false);
  const [config, setConfig] = useState<ShareConfig>({
    enabled: false,
    token: "",
    widgets: ["clock", "weather", "calendar"],
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setConfig(JSON.parse(saved)); } catch { /* */ }
    }
  }, []);

  function save(updated: ShareConfig) {
    setConfig(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  function toggleSharing() {
    const newConfig = { ...config, enabled: !config.enabled };
    if (newConfig.enabled && !newConfig.token) {
      newConfig.token = generateToken();
    }
    save(newConfig);
  }

  function toggleWidget(widgetId: string) {
    const widgets = config.widgets.includes(widgetId)
      ? config.widgets.filter((w) => w !== widgetId)
      : [...config.widgets, widgetId];
    save({ ...config, widgets });
  }

  async function copyUrl() {
    const url = shareUrl;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* */ }
  }

  function openPreview() {
    window.open(shareUrl, "_blank");
  }

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/shared/${config.token}`;

  if (!mounted) {
    return (
      <GlassCard className="flex items-center justify-center">
        <div className="h-32 w-full rounded bg-separator animate-pulse" />
      </GlassCard>
    );
  }

  return (
    <GlassCard className="flex flex-col" hover3d={false}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Share2 size={13} className="text-accent" />
          <p className="text-xs font-medium text-fg-secondary uppercase tracking-wider">Dela Dashboard</p>
        </div>
        <button
          onClick={toggleSharing}
          className={`flex items-center gap-1.5 text-xs transition-colors ${
            config.enabled ? "text-green-400" : "text-fg-tertiary"
          }`}
        >
          {config.enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
          {config.enabled ? "Aktiv" : "Inaktiv"}
        </button>
      </div>

      {config.enabled ? (
        <>
          {/* Share URL */}
          <div className="flex items-center gap-1.5 mb-3 p-2 rounded-lg bg-surface/30">
            <span className="text-[10px] text-fg-tertiary font-mono truncate flex-1">{shareUrl}</span>
            <button onClick={copyUrl} className="btn-ghost !p-1 shrink-0" title="Kopiera URL">
              {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mb-3">
            <button onClick={copyUrl} className="btn-primary !py-1.5 !px-3 !text-xs flex items-center gap-1.5">
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "Kopierad!" : "Kopiera lank"}
            </button>
            <button onClick={openPreview} className="btn-ghost !py-1.5 !px-3 !text-xs flex items-center gap-1.5 border border-separator rounded-xl">
              <ExternalLink size={12} />
              Forhandsgranska
            </button>
          </div>

          {/* Widget selection */}
          <div className="border-t border-separator pt-3">
            <p className="text-[11px] text-fg-tertiary mb-2 flex items-center gap-1">
              <Eye size={11} />
              Valj vilka widgets som visas:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_WIDGETS.map((widget) => {
                const selected = config.widgets.includes(widget.id);
                return (
                  <button
                    key={widget.id}
                    onClick={() => toggleWidget(widget.id)}
                    className={`
                      text-[11px] px-2.5 py-1 rounded-full transition-all
                      ${selected
                        ? "bg-accent/20 text-accent border border-accent/30"
                        : "bg-surface/30 text-fg-tertiary border border-transparent hover:border-separator"
                      }
                    `}
                  >
                    {selected ? <Eye size={9} className="inline mr-1 -mt-[1px]" /> : <EyeOff size={9} className="inline mr-1 -mt-[1px]" />}
                    {widget.label}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <p className="text-xs text-fg-tertiary text-center py-6">
          Aktivera delning for att generera en publik lank till din dashboard.
        </p>
      )}
    </GlassCard>
  );
}

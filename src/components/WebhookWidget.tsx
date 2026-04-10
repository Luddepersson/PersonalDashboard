"use client";

import { useState, useEffect } from "react";
import { Webhook, Plus, Trash2, Copy, Check, Zap, ExternalLink } from "lucide-react";
import GlassCard from "./GlassCard";

interface WebhookEvent {
  id: string;
  title: string;
  message: string;
  type: string;
  timestamp: string;
}

const STORAGE_KEY = "dashboard-webhooks";

const DEMO_EVENTS = [
  { title: "Deploy lyckades", message: "Produktionsdeploy v2.4.1 klar.", type: "success" },
  { title: "Ny issue", message: "Bug: Inloggning fungerar inte pa Safari.", type: "warning" },
  { title: "CI Misslyckades", message: "Test suite misslyckades i main-branch.", type: "error" },
  { title: "Ny kommentar", message: "Anna kommenterade pa PR #42.", type: "info" },
  { title: "Server alert", message: "CPU anvandning over 90% i 5 minuter.", type: "error" },
];

function getTypeColor(type: string): string {
  switch (type) {
    case "success": return "text-green-400";
    case "warning": return "text-yellow-400";
    case "error": return "text-red-400";
    default: return "text-accent";
  }
}

function getTypeBg(type: string): string {
  switch (type) {
    case "success": return "bg-green-400/10";
    case "warning": return "bg-yellow-400/10";
    case "error": return "bg-red-400/10";
    default: return "bg-accent/10";
  }
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("sv-SE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function WebhookWidget() {
  const [mounted, setMounted] = useState(false);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [copied, setCopied] = useState(false);

  const webhookUrl = "https://your-dashboard.vercel.app/api/webhooks/abc123";

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setEvents(JSON.parse(saved)); } catch { /* */ }
    }
  }, []);

  function save(updated: WebhookEvent[]) {
    setEvents(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  function simulateWebhook() {
    const demo = DEMO_EVENTS[Math.floor(Math.random() * DEMO_EVENTS.length)];
    const event: WebhookEvent = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
      title: demo.title,
      message: demo.message,
      type: demo.type,
      timestamp: new Date().toISOString(),
    };
    save([event, ...events]);
  }

  function clearAll() {
    save([]);
  }

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* */ }
  }

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
          <Webhook size={13} className="text-accent" />
          <p className="text-xs font-medium text-fg-secondary uppercase tracking-wider">Webhooks</p>
        </div>
        <div className="flex items-center gap-1">
          {events.length > 0 && (
            <button onClick={clearAll} className="btn-ghost !p-1 rounded-lg text-fg-tertiary hover:text-red-400" title="Rensa alla">
              <Trash2 size={12} />
            </button>
          )}
          <button onClick={simulateWebhook} className="btn-ghost !p-1 rounded-lg flex items-center gap-1 text-[10px] text-fg-tertiary">
            <Zap size={12} /> Simulera
          </button>
        </div>
      </div>

      {/* Webhook URL */}
      <div className="flex items-center gap-1.5 mb-3 p-2 rounded-lg bg-surface/30">
        <ExternalLink size={11} className="text-fg-tertiary shrink-0" />
        <span className="text-[10px] text-fg-tertiary font-mono truncate flex-1">{webhookUrl}</span>
        <button onClick={copyUrl} className="btn-ghost !p-1 shrink-0" title="Kopiera URL">
          {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
        </button>
      </div>

      {/* Event list */}
      <div className="space-y-1.5 max-h-[220px] overflow-y-auto -mr-1 pr-1 flex-1">
        {events.length === 0 && (
          <p className="text-xs text-fg-tertiary text-center py-6">
            Inga webhook-handelser. Klicka &quot;Simulera&quot; for att testa.
          </p>
        )}
        {events.map((event) => (
          <div
            key={event.id}
            className={`flex items-start gap-2 py-2 px-2.5 rounded-lg ${getTypeBg(event.type)} transition-colors`}
          >
            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${getTypeColor(event.type).replace("text-", "bg-")}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-foreground truncate">{event.title}</p>
                <span className="text-[9px] text-fg-tertiary shrink-0">{formatTimestamp(event.timestamp)}</span>
              </div>
              <p className="text-[11px] text-fg-secondary mt-0.5 line-clamp-2">{event.message}</p>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

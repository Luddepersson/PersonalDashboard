"use client";

import { useState, useEffect, useCallback } from "react";
import GlassCard from "../GlassCard";
import { Rss, RefreshCw, Plus, X, ExternalLink } from "lucide-react";

interface FeedItem {
  title: string;
  link: string;
  source: string;
  pubDate: Date;
}

const LS_KEY = "dashboard-rss-feeds";
const DEFAULT_FEEDS = ["https://hnrss.org/frontpage"];

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just nu";
  if (mins < 60) return `${mins}m sedan`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h sedan`;
  const days = Math.floor(hrs / 24);
  return `${days}d sedan`;
}

function getFeeds(): string[] {
  if (typeof window === "undefined") return DEFAULT_FEEDS;
  try {
    const stored = localStorage.getItem(LS_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_FEEDS;
  } catch { return DEFAULT_FEEDS; }
}

export default function RSSWidget() {
  const [mounted, setMounted] = useState(false);
  const [feeds, setFeeds] = useState<string[]>(DEFAULT_FEEDS);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { setMounted(true); setFeeds(getFeeds()); }, []);

  const fetchFeeds = useCallback(async (urls: string[]) => {
    setLoading(true);
    setError("");
    const allItems: FeedItem[] = [];
    for (const feedUrl of urls) {
      try {
        const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(feedUrl)}`);
        if (!res.ok) throw new Error("Fetch misslyckades");
        const data = await res.json();
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.contents, "text/xml");
        const channelTitle = doc.querySelector("channel > title")?.textContent || new URL(feedUrl).hostname;
        doc.querySelectorAll("item").forEach((item) => {
          allItems.push({
            title: item.querySelector("title")?.textContent || "Utan titel",
            link: item.querySelector("link")?.textContent || "#",
            source: channelTitle,
            pubDate: new Date(item.querySelector("pubDate")?.textContent || Date.now()),
          });
        });
      } catch {
        setError("Kunde inte hämta ett eller flera flöden");
      }
    }
    allItems.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
    setItems(allItems.slice(0, 8));
    setLoading(false);
  }, []);

  useEffect(() => { if (mounted) fetchFeeds(feeds); }, [mounted, feeds, fetchFeeds]);

  const saveFeeds = (f: string[]) => {
    setFeeds(f);
    localStorage.setItem(LS_KEY, JSON.stringify(f));
  };

  const addFeed = () => {
    if (!newUrl.trim()) return;
    const updated = [...feeds, newUrl.trim()];
    saveFeeds(updated);
    setNewUrl("");
    setShowAdd(false);
  };

  const removeFeed = (url: string) => {
    const updated = feeds.filter((f) => f !== url);
    saveFeeds(updated);
  };

  if (!mounted) return <GlassCard className="h-[280px]"><div /></GlassCard>;

  return (
    <GlassCard className="h-[280px] flex flex-col p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Rss size={16} className="text-accent" />
          <h3 className="text-foreground font-semibold text-sm">Nyhetsflöde</h3>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setShowAdd(!showAdd)} className="btn-ghost p-1 rounded" title="Lägg till flöde">
            <Plus size={14} />
          </button>
          <button onClick={() => fetchFeeds(feeds)} className="btn-ghost p-1 rounded" title="Uppdatera" disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="flex gap-1 mb-2">
          <input
            className="input-base text-xs flex-1"
            placeholder="RSS URL..."
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addFeed()}
          />
          <button onClick={addFeed} className="btn-primary text-xs px-2 py-1 rounded">Lägg till</button>
        </div>
      )}

      {feeds.length > 1 && showAdd && (
        <div className="flex flex-wrap gap-1 mb-2">
          {feeds.map((f) => (
            <span key={f} className="text-fg-tertiary text-[10px] flex items-center gap-1 bg-white/5 rounded px-1">
              {new URL(f).hostname}
              <button onClick={() => removeFeed(f)} className="hover:text-red-400"><X size={10} /></button>
            </span>
          ))}
        </div>
      )}

      {error && <p className="text-red-400 text-xs mb-1">{error}</p>}

      <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
        {items.map((item, i) => (
          <a key={i} href={item.link} target="_blank" rel="noopener noreferrer"
            className="block group hover:bg-white/5 rounded p-1 -mx-1 transition-colors">
            <div className="flex items-start gap-1">
              <ExternalLink size={10} className="text-fg-tertiary mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="min-w-0">
                <p className="text-foreground text-xs leading-tight truncate group-hover:text-accent transition-colors">{item.title}</p>
                <p className="text-fg-tertiary text-[10px]">{item.source} · {relativeTime(item.pubDate)}</p>
              </div>
            </div>
          </a>
        ))}
        {!loading && items.length === 0 && <p className="text-fg-secondary text-xs text-center mt-8">Inga artiklar</p>}
      </div>
    </GlassCard>
  );
}

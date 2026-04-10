"use client";

import { useState, useEffect } from "react";
import { Plus, X, Globe, Star } from "lucide-react";
import GlassCard from "./GlassCard";

interface Bookmark { id: string; name: string; url: string; }

export default function BookmarksWidget() {
  const [mounted, setMounted] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("dashboard-bookmarks");
    if (saved) { try { setBookmarks(JSON.parse(saved)); } catch { /* */ } }
  }, []);

  function save(updated: Bookmark[]) { setBookmarks(updated); localStorage.setItem("dashboard-bookmarks", JSON.stringify(updated)); }

  function add() {
    if (!name.trim() || !url.trim()) return;
    let finalUrl = url.trim();
    if (!finalUrl.startsWith("http")) finalUrl = "https://" + finalUrl;
    save([...bookmarks, { id: Date.now().toString(), name: name.trim(), url: finalUrl }]);
    setName(""); setUrl(""); setShowAdd(false);
  }

  function getFavicon(siteUrl: string) {
    try {
      const host = new URL(siteUrl).hostname;
      return `https://www.google.com/s2/favicons?domain=${host}&sz=32`;
    } catch { return null; }
  }

  if (!mounted) return <GlassCard className="flex items-center justify-center"><div className="h-6 w-24 rounded bg-separator animate-pulse" /></GlassCard>;

  return (
    <GlassCard className="flex flex-col" hover3d={false}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Star size={13} className="text-accent" />
          <p className="text-xs font-medium text-fg-secondary uppercase tracking-wider">Favoriter</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-ghost !p-1 rounded-lg">
          {showAdd ? <X size={12} /> : <Plus size={12} />}
        </button>
      </div>

      {showAdd && (
        <div className="flex flex-col gap-1.5 mb-2 p-2 rounded-lg bg-surface/30">
          <input type="text" placeholder="Namn" value={name} onChange={(e) => setName(e.target.value)} className="input-base !py-1 !text-xs" />
          <div className="flex gap-1.5">
            <input type="text" placeholder="URL" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} className="input-base !py-1 !text-xs flex-1" />
            <button onClick={add} className="btn-primary !py-1 !px-2.5 !text-[10px]">Lägg till</button>
          </div>
        </div>
      )}

      {bookmarks.length === 0 && !showAdd ? (
        <p className="text-xs text-fg-tertiary text-center py-6 mt-auto">Lägg till dina favoritsidor</p>
      ) : (
        <div className="space-y-0.5 overflow-y-auto flex-1 -mr-1 pr-1">
          {bookmarks.map((b) => (
            <a
              key={b.id}
              href={b.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-separator/50 transition-all"
            >
              {getFavicon(b.url) ? (
                <img src={getFavicon(b.url)!} alt="" className="w-4 h-4 rounded-sm shrink-0" />
              ) : (
                <Globe size={14} className="text-fg-tertiary shrink-0" />
              )}
              <span className="text-xs text-foreground group-hover:text-accent transition-colors truncate flex-1">{b.name}</span>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); save(bookmarks.filter((x) => x.id !== b.id)); }}
                className="opacity-0 group-hover:opacity-100 btn-ghost !p-0.5 text-fg-tertiary hover:text-accent-warm shrink-0"
              >
                <X size={10} />
              </button>
            </a>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Code, Globe, FolderOpen, Terminal, Music, MessageSquare, FileText, GitBranch, X, ExternalLink } from "lucide-react";

interface QuickLink { id: string; name: string; url: string; icon: string; color: string; }

const ICON_OPTIONS = [
  { name: "code", icon: Code }, { name: "globe", icon: Globe },
  { name: "folder", icon: FolderOpen }, { name: "terminal", icon: Terminal },
  { name: "music", icon: Music }, { name: "chat", icon: MessageSquare },
  { name: "file", icon: FileText }, { name: "github", icon: GitBranch },
];

const COLOR_OPTIONS = ["#0e88b0", "#e07a5f", "#69db7c", "#da77f2", "#ffa94d", "#d4b896", "#74c0fc", "#f2e0d0"];

function getIcon(iconName: string, size = 24) {
  const match = ICON_OPTIONS.find((o) => o.name === iconName);
  const Icon = match ? match.icon : Globe;
  return <Icon size={size} />;
}

export default function LinksPage() {
  const [mounted, setMounted] = useState(false);
  const [links, setLinks] = useState<QuickLink[]>([]);
  const [newLink, setNewLink] = useState({ name: "", url: "", icon: "globe", color: "#0e88b0" });

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("quick-links");
    if (saved) { try { setLinks(JSON.parse(saved)); } catch {} }
  }, []);

  function saveLinks(updated: QuickLink[]) {
    setLinks(updated);
    localStorage.setItem("quick-links", JSON.stringify(updated));
  }

  function addLink() {
    if (!newLink.name || !newLink.url) return;
    saveLinks([...links, { ...newLink, id: Date.now().toString() }]);
    setNewLink({ name: "", url: "", icon: "globe", color: "#0e88b0" });
  }

  if (!mounted) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="h-8 w-48 rounded bg-separator animate-pulse" />
          <div className="h-4 w-64 rounded bg-separator animate-pulse mt-3" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 rounded-xl bg-separator animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tighter">Snabblankar</h1>
        <p className="text-sm text-fg-secondary mt-1.5">Dina sparade genragar till favoritsajter</p>
      </div>

      {/* Add Form -- always visible */}
      <div className="glass p-5 sm:p-6 mb-8">
        <h3 className="text-sm font-semibold text-foreground mb-4">Lagg till ny lank</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <input
            type="text"
            placeholder="Namn..."
            value={newLink.name}
            onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
            className="input-base !py-2.5"
          />
          <input
            type="text"
            placeholder="URL (https://...)  "
            value={newLink.url}
            onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && addLink()}
            className="input-base !py-2.5"
          />
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div>
            <p className="text-xs text-fg-tertiary mb-2">Ikon</p>
            <div className="flex gap-1.5">
              {ICON_OPTIONS.map((opt) => (
                <button
                  key={opt.name}
                  onClick={() => setNewLink({ ...newLink, icon: opt.name })}
                  className={`btn-ghost p-2.5 rounded-lg ${
                    newLink.icon === opt.name ? "bg-accent/15 text-accent" : ""
                  }`}
                >
                  <opt.icon size={16} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-fg-tertiary mb-2">Farg</p>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewLink({ ...newLink, color: c })}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    newLink.color === c ? "scale-110 ring-2 ring-offset-2 ring-accent/30" : ""
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
          <button onClick={addLink} className="btn-primary !py-2.5 !px-6 sm:ml-auto sm:self-end flex items-center gap-2">
            <Plus size={16} /> Lagg till
          </button>
        </div>
      </div>

      {/* Links Grid */}
      {links.length === 0 && (
        <div className="glass p-12 text-center">
          <Globe size={40} className="text-fg-tertiary/30 mx-auto mb-4" />
          <p className="text-base text-fg-tertiary">Inga snabblankar annu</p>
          <p className="text-sm text-fg-tertiary/60 mt-1">Lagg till dina favoritsajter ovan</p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {links.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="glass group relative flex flex-col items-center gap-3 p-6 hover:bg-surface/50 transition-all"
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
              style={{ background: `${link.color}18`, color: link.color }}
            >
              {getIcon(link.icon)}
            </div>
            <span className="text-sm font-medium text-foreground group-hover:text-accent truncate w-full text-center">
              {link.name}
            </span>
            <span className="text-xs text-fg-tertiary truncate w-full text-center">
              {link.url.replace(/^https?:\/\//, "").split("/")[0]}
            </span>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); saveLinks(links.filter((l) => l.id !== link.id)); }}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 btn-ghost p-1.5 text-fg-tertiary hover:text-accent-warm transition-opacity"
            >
              <Trash2 size={14} />
            </button>
          </a>
        ))}
      </div>
    </div>
  );
}

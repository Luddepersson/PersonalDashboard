"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Code, Globe, FolderOpen, Terminal, Music, MessageSquare, FileText, GitBranch, XIcon } from "lucide-react";
import GlassCard from "./GlassCard";

interface QuickLink { id: string; name: string; url: string; icon: string; color: string; }

const ICON_OPTIONS = [
  { name: "code", icon: Code }, { name: "globe", icon: Globe },
  { name: "folder", icon: FolderOpen }, { name: "terminal", icon: Terminal },
  { name: "music", icon: Music }, { name: "chat", icon: MessageSquare },
  { name: "file", icon: FileText }, { name: "github", icon: GitBranch },
];

const COLOR_OPTIONS = ["#0e88b0", "#e07a5f", "#69db7c", "#da77f2", "#ffa94d", "#d4b896", "#74c0fc", "#f2e0d0"];

function getIcon(iconName: string, size = 18) {
  const match = ICON_OPTIONS.find((o) => o.name === iconName);
  const Icon = match ? match.icon : Globe;
  return <Icon size={size} />;
}

export default function QuickLinksWidget() {
  const [mounted, setMounted] = useState(false);
  const [links, setLinks] = useState<QuickLink[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newLink, setNewLink] = useState({ name: "", url: "", icon: "globe", color: "#0e88b0" });

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("quick-links");
    if (saved) { try { setLinks(JSON.parse(saved)); } catch { /* */ } }
  }, []);

  function saveLinks(updated: QuickLink[]) { setLinks(updated); localStorage.setItem("quick-links", JSON.stringify(updated)); }

  function addLink() {
    if (!newLink.name || !newLink.url) return;
    saveLinks([...links, { ...newLink, id: Date.now().toString() }]);
    setNewLink({ name: "", url: "", icon: "globe", color: "#0e88b0" });
    setShowAdd(false);
  }

  if (!mounted) return <GlassCard className=" flex items-center justify-center"><div className="h-8 w-28 rounded bg-separator animate-pulse" /></GlassCard>;

  return (
    <GlassCard className="" hover3d={false}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-medium text-fg-secondary uppercase tracking-wider">Snabblänkar</p>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-ghost p-1 rounded-lg">
          {showAdd ? <XIcon size={14} /> : <Plus size={14} />}
        </button>
      </div>

      {showAdd && (
        <div className="mb-4 p-3 rounded-lg bg-surface space-y-2">
          <input type="text" placeholder="Namn" value={newLink.name} onChange={(e) => setNewLink({ ...newLink, name: e.target.value })} className="input-base w-full" />
          <input type="text" placeholder="URL" value={newLink.url} onChange={(e) => setNewLink({ ...newLink, url: e.target.value })} className="input-base w-full" />
          <div className="flex gap-1.5">
            {ICON_OPTIONS.map((opt) => (<button key={opt.name} onClick={() => setNewLink({ ...newLink, icon: opt.name })} className={`btn-ghost p-1.5 rounded-lg ${newLink.icon === opt.name ? "bg-accent-subtle text-accent" : ""}`}><opt.icon size={13} /></button>))}
          </div>
          <div className="flex gap-1.5">
            {COLOR_OPTIONS.map((c) => (<button key={c} onClick={() => setNewLink({ ...newLink, color: c })} className={`w-5 h-5 rounded-full transition-transform ${newLink.color === c ? "scale-125 ring-2 ring-accent/30" : ""}`} style={{ background: c }} />))}
          </div>
          <button onClick={addLink} className="btn-primary w-full text-sm">Lägg till</button>
        </div>
      )}

      {links.length === 0 && !showAdd && (
        <p className="text-sm text-fg-tertiary text-center py-6">Inga snabblänkar. Klicka + för att lägga till.</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
        {links.map((link) => (
          <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="group relative flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-separator transition-all">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105" style={{ background: `${link.color}18`, color: link.color }}>
              {getIcon(link.icon)}
            </div>
            <span className="text-[11px] text-fg-secondary group-hover:text-foreground truncate w-full text-center">{link.name}</span>
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); saveLinks(links.filter((l) => l.id !== link.id)); }} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 btn-ghost p-0.5 text-fg-tertiary hover:text-accent-warm">
              <Trash2 size={10} />
            </button>
          </a>
        ))}
      </div>
    </GlassCard>
  );
}

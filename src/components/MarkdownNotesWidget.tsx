"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileText, Edit3, Eye, Plus, Trash2, ChevronDown } from "lucide-react";
import GlassCard from "./GlassCard";

interface Note { id: string; title: string; content: string; updatedAt: string; }

export default function MarkdownNotesWidget() {
  const [mounted, setMounted] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string>("");
  const [isEditing, setIsEditing] = useState(true);
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("dashboard-md-notes");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) { setNotes(parsed); setActiveNoteId(parsed[0].id); return; }
      } catch { /* */ }
    }
  }, []);

  if (!mounted) return <GlassCard className=" flex items-center justify-center"><div className="h-8 w-28 rounded bg-separator animate-pulse" /></GlassCard>;

  function save(updated: Note[]) { setNotes(updated); localStorage.setItem("dashboard-md-notes", JSON.stringify(updated)); }

  function addNote() {
    const note: Note = { id: Date.now().toString(), title: "Ny anteckning", content: "", updatedAt: new Date().toISOString() };
    save([note, ...notes]);
    setActiveNoteId(note.id);
    setIsEditing(true);
    setShowList(false);
  }

  function removeNote(id: string) {
    const updated = notes.filter((n) => n.id !== id);
    save(updated);
    if (activeNoteId === id) setActiveNoteId(updated[0]?.id || "");
  }

  const activeNote = notes.find((n) => n.id === activeNoteId);

  return (
    <GlassCard className=" flex flex-col" hover3d={false}>
      <div className="flex items-center gap-2 mb-3">
        <FileText size={14} className="text-accent-secondary shrink-0" />
        <div className="relative flex-1 min-w-0">
          <button onClick={() => setShowList(!showList)} className="flex items-center gap-1 text-sm text-foreground hover:text-accent transition-colors max-w-full">
            <span className="truncate">{activeNote?.title || "Anteckningar"}</span>
            {notes.length > 0 && <ChevronDown size={12} className="shrink-0 text-fg-tertiary" />}
          </button>
          {showList && (
            <div className="absolute top-full left-0 mt-1 w-56 py-1 rounded-lg bg-surface-elevated border border-separator shadow-xl z-20">
              {notes.map((n) => (
                <button key={n.id} onClick={() => { setActiveNoteId(n.id); setShowList(false); }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between group transition-colors ${n.id === activeNoteId ? "text-accent bg-accent-subtle" : "text-fg-secondary hover:bg-separator"}`}>
                  <span className="truncate">{n.title}</span>
                  {notes.length > 1 && <button onClick={(e) => { e.stopPropagation(); removeNote(n.id); }} className="opacity-0 group-hover:opacity-100 text-fg-tertiary hover:text-accent-warm"><Trash2 size={10} /></button>}
                </button>
              ))}
              <button onClick={addNote} className="w-full text-left px-3 py-2 text-xs text-accent hover:bg-separator flex items-center gap-1.5 border-t border-separator">
                <Plus size={10} /> Ny anteckning
              </button>
            </div>
          )}
        </div>
        {notes.length === 0 && <button onClick={addNote} className="btn-primary text-xs !py-1 !px-3">+ Ny</button>}
        {activeNote && (
          <div className="flex gap-0.5 shrink-0">
            <button onClick={() => setIsEditing(true)} className={`btn-ghost p-1.5 rounded-lg ${isEditing ? "bg-accent-subtle text-accent" : ""}`}><Edit3 size={12} /></button>
            <button onClick={() => setIsEditing(false)} className={`btn-ghost p-1.5 rounded-lg ${!isEditing ? "bg-accent-subtle text-accent" : ""}`}><Eye size={12} /></button>
          </div>
        )}
      </div>

      {!activeNote ? (
        <p className="text-sm text-fg-tertiary text-center py-8">Skapa din första anteckning med knappen ovan.</p>
      ) : (
        <>
          {isEditing && <input type="text" value={activeNote.title} onChange={(e) => save(notes.map((n) => n.id === activeNoteId ? { ...n, title: e.target.value, updatedAt: new Date().toISOString() } : n))} className="bg-transparent text-sm font-medium text-foreground focus:outline-none border-b border-separator pb-2 mb-2" placeholder="Titel..." />}
          <div className="flex-1 overflow-y-auto min-h-[150px]">
            {isEditing ? (
              <textarea value={activeNote.content} onChange={(e) => save(notes.map((n) => n.id === activeNoteId ? { ...n, content: e.target.value, updatedAt: new Date().toISOString() } : n))}
                placeholder="Skriv markdown här..." className="w-full h-full min-h-[150px] bg-transparent text-sm text-foreground/80 placeholder-fg-tertiary focus:outline-none resize-none font-mono leading-relaxed" />
            ) : (
              <div className="markdown-content text-sm text-foreground/80">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeNote.content || "*Tom anteckning*"}</ReactMarkdown>
              </div>
            )}
          </div>
        </>
      )}
    </GlassCard>
  );
}

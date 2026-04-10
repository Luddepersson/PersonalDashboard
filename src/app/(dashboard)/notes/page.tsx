"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileText, Edit3, Eye, Plus, Trash2, Search } from "lucide-react";

interface Note { id: string; title: string; content: string; updatedAt: string; }

export default function NotesPage() {
  const [mounted, setMounted] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string>("");
  const [isEditing, setIsEditing] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("dashboard-md-notes");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) { setNotes(parsed); setActiveNoteId(parsed[0].id); return; }
      } catch {}
    }
  }, []);

  if (!mounted) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="h-8 w-48 rounded bg-separator animate-pulse" />
          <div className="h-4 w-64 rounded bg-separator animate-pulse mt-3" />
        </div>
        <div className="grid grid-cols-3 gap-6 h-[600px]">
          <div className="rounded-xl bg-separator animate-pulse" />
          <div className="col-span-2 rounded-xl bg-separator animate-pulse" />
        </div>
      </div>
    );
  }

  function save(updated: Note[]) {
    setNotes(updated);
    localStorage.setItem("dashboard-md-notes", JSON.stringify(updated));
  }

  function addNote() {
    const note: Note = {
      id: Date.now().toString(),
      title: "Ny anteckning",
      content: "",
      updatedAt: new Date().toISOString(),
    };
    save([note, ...notes]);
    setActiveNoteId(note.id);
    setIsEditing(true);
  }

  function removeNote(id: string) {
    const updated = notes.filter((n) => n.id !== id);
    save(updated);
    if (activeNoteId === id) setActiveNoteId(updated[0]?.id || "");
  }

  const activeNote = notes.find((n) => n.id === activeNoteId);
  const filteredNotes = search
    ? notes.filter((n) => n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase()))
    : notes;

  function formatDate(iso: string) {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("sv-SE", { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tighter">Anteckningar</h1>
          <p className="text-sm text-fg-secondary mt-1.5">Skriv och organisera dina anteckningar med Markdown</p>
        </div>
        <button onClick={addNote} className="btn-primary flex items-center gap-2 !py-2.5 !px-5">
          <Plus size={16} /> Ny anteckning
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ minHeight: "600px" }}>
        {/* Note List Sidebar */}
        <div className="glass p-4 flex flex-col overflow-hidden">
          {/* Search */}
          <div className="relative mb-4">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-tertiary" />
            <input
              type="text"
              placeholder="Sok anteckningar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base w-full !pl-9 !py-2.5"
            />
          </div>

          <div className="text-xs text-fg-tertiary mb-3 px-1">
            {notes.length} anteckning{notes.length !== 1 ? "ar" : ""}
          </div>

          {/* Note list */}
          <div className="flex-1 overflow-y-auto space-y-1 -mr-1 pr-1">
            {filteredNotes.length === 0 && (
              <p className="text-sm text-fg-tertiary text-center py-8">
                {search ? "Inga matchande anteckningar" : "Skapa din forsta anteckning"}
              </p>
            )}
            {filteredNotes.map((note) => (
              <button
                key={note.id}
                onClick={() => setActiveNoteId(note.id)}
                className={`w-full text-left p-3 rounded-lg transition-all group ${
                  note.id === activeNoteId
                    ? "bg-accent/10 border border-accent/20"
                    : "hover:bg-surface/50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium truncate ${
                      note.id === activeNoteId ? "text-accent" : "text-foreground"
                    }`}>
                      {note.title}
                    </p>
                    <p className="text-xs text-fg-tertiary truncate mt-1">
                      {note.content.slice(0, 80) || "Tom anteckning"}
                    </p>
                    <p className="text-[10px] text-fg-tertiary/60 mt-1.5">
                      {formatDate(note.updatedAt)}
                    </p>
                  </div>
                  {notes.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); removeNote(note.id); }}
                      className="opacity-0 group-hover:opacity-100 text-fg-tertiary hover:text-accent-warm p-1 shrink-0 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Editor Area */}
        <div className="lg:col-span-2 glass p-6 flex flex-col overflow-hidden">
          {!activeNote ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <FileText size={48} className="text-fg-tertiary/20 mb-4" />
              <p className="text-base text-fg-tertiary">Valj en anteckning eller skapa en ny</p>
              <button onClick={addNote} className="btn-primary mt-4 flex items-center gap-2">
                <Plus size={14} /> Skapa anteckning
              </button>
            </div>
          ) : (
            <>
              {/* Editor toolbar */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-separator">
                <div className="flex gap-1">
                  <button
                    onClick={() => setIsEditing(true)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isEditing ? "bg-accent/15 text-accent" : "text-fg-tertiary hover:text-fg-secondary"
                    }`}
                  >
                    <Edit3 size={14} /> Redigera
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      !isEditing ? "bg-accent/15 text-accent" : "text-fg-tertiary hover:text-fg-secondary"
                    }`}
                  >
                    <Eye size={14} /> Forhandsgranska
                  </button>
                </div>
                <button
                  onClick={() => removeNote(activeNote.id)}
                  className="btn-ghost p-2 rounded-lg text-fg-tertiary hover:text-accent-warm"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Title */}
              {isEditing && (
                <input
                  type="text"
                  value={activeNote.title}
                  onChange={(e) => save(notes.map((n) =>
                    n.id === activeNoteId ? { ...n, title: e.target.value, updatedAt: new Date().toISOString() } : n
                  ))}
                  className="bg-transparent text-xl font-semibold text-foreground focus:outline-none mb-4"
                  placeholder="Titel..."
                />
              )}
              {!isEditing && (
                <h2 className="text-xl font-semibold text-foreground mb-4">{activeNote.title}</h2>
              )}

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {isEditing ? (
                  <textarea
                    value={activeNote.content}
                    onChange={(e) => save(notes.map((n) =>
                      n.id === activeNoteId ? { ...n, content: e.target.value, updatedAt: new Date().toISOString() } : n
                    ))}
                    placeholder="Skriv din anteckning har... (Markdown stods)"
                    className="w-full h-full min-h-[400px] bg-transparent text-base text-foreground/80 placeholder-fg-tertiary focus:outline-none resize-none font-mono leading-relaxed"
                  />
                ) : (
                  <div className="markdown-content text-base text-foreground/80 leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {activeNote.content || "*Tom anteckning*"}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

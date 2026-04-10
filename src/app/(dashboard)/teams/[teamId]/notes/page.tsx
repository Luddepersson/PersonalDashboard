"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import GlassCard from "@/components/GlassCard";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  Loader2,
  Plus,
  FileText,
  Edit3,
  Eye,
  Save,
  AlertCircle,
  X,
} from "lucide-react";

interface Note {
  id: string;
  title: string;
  content: string;
  user_id: string;
  team_id: string;
  created_at: string;
  updated_at: string;
  profile?: { name: string };
}

export default function TeamNotesPage() {
  const params = useParams();
  const teamId = params.teamId as string;

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchNotes = useCallback(async () => {
    if (!teamId) return;
    try {
      const res = await fetch(`/api/teams/${teamId}/notes`);
      if (!res.ok) throw new Error("Kunde inte ladda anteckningar");
      const data = await res.json();
      setNotes(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ett oväntat fel uppstod");
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const selectedNote = notes.find((n) => n.id === selectedId) || null;

  function selectNote(note: Note) {
    setSelectedId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditMode(false);
  }

  function startEdit() {
    if (!selectedNote) return;
    setEditTitle(selectedNote.title);
    setEditContent(selectedNote.content);
    setEditMode(true);
  }

  async function saveNote() {
    if (!selectedNote) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedNote.id,
          title: editTitle,
          content: editContent,
        }),
      });
      if (!res.ok) throw new Error("Kunde inte spara anteckning");
      const updated = await res.json();
      setNotes((prev) =>
        prev.map((n) => (n.id === updated.id ? { ...n, ...updated } : n))
      );
      setEditMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte spara");
    } finally {
      setSaving(false);
    }
  }

  async function createNote() {
    setCreating(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Ny anteckning", content: "" }),
      });
      if (!res.ok) throw new Error("Kunde inte skapa anteckning");
      const created = await res.json();
      setNotes((prev) => [created, ...prev]);
      setSelectedId(created.id);
      setEditTitle(created.title);
      setEditContent(created.content);
      setEditMode(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte skapa anteckning");
    } finally {
      setCreating(false);
    }
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("sv-SE", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 size={28} className="animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/teams/${teamId}/dashboard`} className="btn-ghost !p-2">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground tracking-tight">Anteckningar</h1>
          <p className="text-xs text-fg-tertiary mt-0.5">{notes.length} anteckningar</p>
        </div>
        <button
          onClick={createNote}
          disabled={creating}
          className="btn-primary flex items-center gap-1.5"
        >
          {creating ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Plus size={14} />
          )}
          Ny anteckning
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
          <AlertCircle size={14} className="text-red-400 shrink-0" />
          <p className="text-xs text-red-400 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
            <X size={12} />
          </button>
        </div>
      )}

      {notes.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <FileText size={32} className="text-fg-tertiary opacity-40" />
          <p className="text-sm text-fg-tertiary">
            Inga anteckningar ännu. Skapa den första!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">
          {/* Notes list */}
          <div className="space-y-2 md:max-h-[calc(100vh-14rem)] md:overflow-y-auto md:pr-1">
            {notes.map((note) => (
              <button
                key={note.id}
                onClick={() => selectNote(note)}
                className={`w-full text-left rounded-xl p-3 transition-all border ${
                  selectedId === note.id
                    ? "glass border-accent/30 bg-accent/5"
                    : "glass border-transparent hover:border-white/[0.08]"
                }`}
              >
                <p className="text-sm font-medium text-foreground truncate">
                  {note.title || "Utan titel"}
                </p>
                <p className="text-[11px] text-fg-tertiary mt-1 line-clamp-2">
                  {note.content
                    ? note.content.slice(0, 100) + (note.content.length > 100 ? "..." : "")
                    : "Tom anteckning"}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {note.profile?.name && (
                    <span className="text-[10px] text-fg-tertiary">{note.profile.name}</span>
                  )}
                  <span className="text-[10px] text-fg-tertiary">
                    {formatDate(note.updated_at || note.created_at)}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Note editor / viewer */}
          <GlassCard className="min-h-[400px] flex flex-col" hover3d={false}>
            {selectedNote ? (
              <>
                {/* Toolbar */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
                  <div className="flex-1 min-w-0">
                    {editMode ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="input-base w-full text-sm font-semibold"
                        placeholder="Titel..."
                      />
                    ) : (
                      <h2 className="text-base font-semibold text-foreground truncate">
                        {selectedNote.title || "Utan titel"}
                      </h2>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 ml-3 shrink-0">
                    {editMode ? (
                      <>
                        <button
                          onClick={() => setEditMode(false)}
                          className="btn-ghost !p-2 text-xs flex items-center gap-1"
                        >
                          <Eye size={14} />
                          Förhandsgranska
                        </button>
                        <button
                          onClick={saveNote}
                          disabled={saving}
                          className="btn-primary !py-1.5 !px-3 text-xs flex items-center gap-1"
                        >
                          {saving ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Save size={12} />
                          )}
                          Spara
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={startEdit}
                        className="btn-ghost !p-2 text-xs flex items-center gap-1"
                      >
                        <Edit3 size={14} />
                        Redigera
                      </button>
                    )}
                  </div>
                </div>

                {/* Meta info */}
                <div className="flex items-center gap-3 mb-4 text-[11px] text-fg-tertiary">
                  {selectedNote.profile?.name && (
                    <span>Av {selectedNote.profile.name}</span>
                  )}
                  <span>
                    Uppdaterad {formatDate(selectedNote.updated_at || selectedNote.created_at)}
                  </span>
                </div>

                {/* Content area */}
                <div className="flex-1 overflow-y-auto">
                  {editMode ? (
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="input-base w-full h-full min-h-[300px] resize-none font-mono text-sm leading-relaxed"
                      placeholder="Skriv i markdown..."
                    />
                  ) : (
                    <div className="prose prose-sm prose-invert max-w-none text-foreground prose-headings:text-foreground prose-p:text-fg-secondary prose-a:text-accent prose-strong:text-foreground prose-code:text-accent prose-code:bg-white/[0.05] prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-white/[0.03] prose-pre:border prose-pre:border-white/[0.06]">
                      {selectedNote.content ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {selectedNote.content}
                        </ReactMarkdown>
                      ) : (
                        <p className="text-fg-tertiary italic">
                          Ingen innehåll. Klicka Redigera för att börja skriva.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <FileText size={28} className="text-fg-tertiary opacity-40" />
                <p className="text-sm text-fg-tertiary">
                  Välj en anteckning eller skapa en ny
                </p>
              </div>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
}

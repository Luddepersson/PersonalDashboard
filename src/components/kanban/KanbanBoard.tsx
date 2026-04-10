"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, GripVertical } from "lucide-react";
import GlassCard from "../GlassCard";

type Status = "todo" | "doing" | "done";

interface KanbanItem {
  id: string;
  text: string;
  done: boolean;
  status: Status;
}

const COLUMNS: { key: Status; label: string }[] = [
  { key: "todo", label: "Att göra" },
  { key: "doing", label: "Pågår" },
  { key: "done", label: "Klart" },
];

const STORAGE_KEY = "dashboard-todos";

function loadItems(): KanbanItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown[] = JSON.parse(raw);
    return parsed.map((item: any) => ({
      id: item.id ?? crypto.randomUUID(),
      text: item.text ?? "",
      done: item.done ?? false,
      status: (item.status as Status) ?? (item.done ? "done" : "todo"),
    }));
  } catch {
    return [];
  }
}

function saveItems(items: KanbanItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export default function KanbanBoard() {
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<KanbanItem[]>([]);
  const [input, setInput] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<Status | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setItems(loadItems());
  }, []);

  function update(next: KanbanItem[]) {
    setItems(next);
    saveItems(next);
  }

  function addTask() {
    const text = input.trim();
    if (!text) return;
    const task: KanbanItem = {
      id: crypto.randomUUID(),
      text,
      done: false,
      status: "todo",
    };
    update([task, ...items]);
    setInput("");
  }

  function removeTask(id: string) {
    update(items.filter((t) => t.id !== id));
  }

  /* ---- Drag-and-drop handlers ---- */

  function handleDragStart(e: React.DragEvent, id: string) {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  }

  function handleDragOver(e: React.DragEvent, col: Status) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget(col);
  }

  function handleDragLeave() {
    setDropTarget(null);
  }

  function handleDrop(e: React.DragEvent, col: Status) {
    e.preventDefault();
    setDropTarget(null);
    const id = dragId ?? e.dataTransfer.getData("text/plain");
    if (!id) return;
    const next = items.map((t) =>
      t.id === id ? { ...t, status: col, done: col === "done" } : t
    );
    update(next);
    setDragId(null);
  }

  function handleDragEnd() {
    setDragId(null);
    setDropTarget(null);
  }

  if (!mounted) {
    return (
      <GlassCard className="min-h-[300px] flex items-center justify-center">
        <div className="h-8 w-28 rounded bg-separator animate-pulse" />
      </GlassCard>
    );
  }

  return (
    <GlassCard className="overflow-hidden" hover3d={false}>
      <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
        Kanban
      </h2>

      <div
        ref={scrollRef}
        className="grid grid-cols-1 md:grid-cols-3 gap-3 overflow-x-auto"
        style={{ minHeight: 200 }}
      >
        {COLUMNS.map(({ key, label }) => {
          const colItems = items.filter((t) => t.status === key);
          const isOver = dropTarget === key;

          return (
            <div
              key={key}
              className="flex flex-col rounded-xl p-3 transition-colors"
              style={{
                background: isOver
                  ? "rgba(46,148,190,0.12)"
                  : "rgba(255,255,255,0.04)",
                border: isOver
                  ? "2px dashed rgba(46,148,190,0.5)"
                  : "2px dashed transparent",
                minHeight: 160,
              }}
              onDragOver={(e) => handleDragOver(e, key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, key)}
            >
              {/* Column header */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {label}
                </span>
                <span
                  className="text-xs rounded-full px-2 py-0.5"
                  style={{
                    background: "rgba(46,148,190,0.15)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {colItems.length}
                </span>
              </div>

              {/* Add input for "Att göra" column */}
              {key === "todo" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    addTask();
                  }}
                  className="flex gap-1 mb-2"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ny uppgift..."
                    className="flex-1 rounded-lg px-2 py-1 text-sm outline-none"
                    style={{
                      background: "var(--glass-bg)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--glass-border)",
                    }}
                  />
                  <button
                    type="submit"
                    className="rounded-lg p-1 transition-colors hover:opacity-80"
                    style={{ background: "rgba(46,148,190,0.2)" }}
                    aria-label="Lägg till"
                  >
                    <Plus size={16} style={{ color: "var(--text-primary)" }} />
                  </button>
                </form>
              )}

              {/* Cards */}
              <div className="flex flex-col gap-2 flex-1">
                {colItems.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.id)}
                    onDragEnd={handleDragEnd}
                    className="glass flex items-center gap-2 px-3 py-2 text-sm transition-shadow"
                    style={{
                      cursor: "grab",
                      borderRadius: "0.75rem",
                      opacity: dragId === item.id ? 0.5 : 1,
                      color: "var(--text-primary)",
                    }}
                  >
                    <GripVertical
                      size={14}
                      className="shrink-0 opacity-40"
                    />
                    <span
                      className="flex-1 break-words"
                      style={{
                        textDecoration: item.status === "done" ? "line-through" : "none",
                        opacity: item.status === "done" ? 0.6 : 1,
                      }}
                    >
                      {item.text}
                    </span>
                    <button
                      onClick={() => removeTask(item.id)}
                      className="shrink-0 opacity-40 hover:opacity-100 transition-opacity"
                      aria-label="Ta bort"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

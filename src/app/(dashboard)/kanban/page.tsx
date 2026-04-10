"use client";

import { useState, useEffect } from "react";
import { Plus, GripVertical, X } from "lucide-react";
import GlassCard from "@/components/GlassCard";

interface KanbanItem {
  id: string;
  text: string;
  status: "todo" | "doing" | "done";
}

const COLUMNS: { key: KanbanItem["status"]; label: string; color: string }[] = [
  { key: "todo", label: "Att göra", color: "#2e94be" },
  { key: "doing", label: "Pågår", color: "#e8a838" },
  { key: "done", label: "Klart", color: "#48b068" },
];

export default function KanbanPage() {
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<KanbanItem[]>([]);
  const [newText, setNewText] = useState("");
  const [dragItem, setDragItem] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("dashboard-kanban");
    if (saved) { try { setItems(JSON.parse(saved)); } catch { /* */ } }
  }, []);

  function save(updated: KanbanItem[]) {
    setItems(updated);
    localStorage.setItem("dashboard-kanban", JSON.stringify(updated));
  }

  function addItem() {
    if (!newText.trim()) return;
    save([...items, { id: Date.now().toString(), text: newText.trim(), status: "todo" }]);
    setNewText("");
  }

  function removeItem(id: string) { save(items.filter((i) => i.id !== id)); }

  function handleDragStart(id: string) { setDragItem(id); }

  function handleDrop(status: KanbanItem["status"]) {
    if (!dragItem) return;
    save(items.map((i) => i.id === dragItem ? { ...i, status } : i));
    setDragItem(null);
  }

  if (!mounted) return null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground tracking-tight">Kanban</h1>
        <p className="text-sm text-fg-tertiary mt-0.5">Dra kort mellan kolumner</p>
      </div>

      {/* Add input */}
      <div className="flex gap-2 mb-6 max-w-md">
        <input
          type="text" value={newText} onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          className="input-base flex-1" placeholder="Ny uppgift..."
        />
        <button onClick={addItem} className="btn-primary flex items-center gap-1.5 !py-2">
          <Plus size={14} /> Lägg till
        </button>
      </div>

      {/* Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => {
          const colItems = items.filter((i) => i.status === col.key);
          return (
            <div
              key={col.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(col.key)}
              className="min-h-[300px]"
            >
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                <h3 className="text-sm font-medium text-foreground">{col.label}</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-subtle text-accent font-medium">{colItems.length}</span>
              </div>

              <div className="space-y-2 p-2 rounded-2xl bg-surface/30 border border-separator/50 min-h-[250px]">
                {colItems.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => handleDragStart(item.id)}
                    className={`glass !p-3 !rounded-xl cursor-grab active:cursor-grabbing group transition-all ${
                      dragItem === item.id ? "opacity-50 scale-95" : "hover:scale-[1.02]"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical size={14} className="text-fg-tertiary mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <p className="text-sm text-foreground flex-1">{item.text}</p>
                      <button onClick={() => removeItem(item.id)} className="opacity-0 group-hover:opacity-100 text-fg-tertiary hover:text-accent-warm transition-all shrink-0">
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
                {colItems.length === 0 && (
                  <p className="text-xs text-fg-tertiary text-center py-8">Dra kort hit</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

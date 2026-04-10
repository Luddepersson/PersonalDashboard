"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Check } from "lucide-react";
import GlassCard from "./GlassCard";

interface TodoItem { id: string; text: string; done: boolean; }

export default function NotesWidget() {
  const [mounted, setMounted] = useState(false);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("dashboard-todos");
    if (saved) { try { setTodos(JSON.parse(saved)); } catch { /* */ } }
  }, []);

  function save(updated: TodoItem[]) { setTodos(updated); localStorage.setItem("dashboard-todos", JSON.stringify(updated)); }
  function addTodo() { if (!input.trim()) return; save([{ id: Date.now().toString(), text: input.trim(), done: false }, ...todos]); setInput(""); }
  function toggleTodo(id: string) { save(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t))); }
  function removeTodo(id: string) { save(todos.filter((t) => t.id !== id)); }

  if (!mounted) return <GlassCard className="flex items-center justify-center"><div className="h-6 w-24 rounded bg-separator animate-pulse" /></GlassCard>;

  const doneCount = todos.filter((t) => t.done).length;
  const progress = todos.length > 0 ? (doneCount / todos.length) * 100 : 0;

  return (
    <GlassCard className="flex flex-col" hover3d={false}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-fg-secondary uppercase tracking-wider">Att göra</p>
        {todos.length > 0 && <p className="text-[10px] text-fg-tertiary">{doneCount}/{todos.length}</p>}
      </div>

      {todos.length > 0 && (
        <div className="h-0.5 bg-separator rounded-full mb-2 overflow-hidden">
          <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="flex gap-1.5 mb-2">
        <input type="text" placeholder="Ny uppgift..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTodo()} className="input-base flex-1 !py-1.5 !text-xs" />
        <button onClick={addTodo} className="btn-ghost p-1.5 rounded-lg text-accent"><Plus size={14} /></button>
      </div>

      {todos.length === 0 ? (
        <p className="text-xs text-fg-tertiary text-center py-4 mt-auto">Inga uppgifter ännu</p>
      ) : (
        <div className="space-y-0.5 overflow-y-auto flex-1 -mr-1 pr-1">
          {todos.map((todo) => (
            <div key={todo.id} className={`group flex items-center gap-2 px-1.5 py-1.5 rounded-lg hover:bg-separator/50 transition-all ${todo.done ? "opacity-40" : ""}`}>
              <button onClick={() => toggleTodo(todo.id)}
                className={`shrink-0 w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all ${todo.done ? "bg-accent border-accent text-white" : "border-fg-tertiary/40 hover:border-accent"}`}>
                {todo.done && <Check size={9} strokeWidth={3} />}
              </button>
              <span className={`flex-1 text-xs ${todo.done ? "line-through text-fg-tertiary" : "text-foreground"}`}>{todo.text}</span>
              <button onClick={() => removeTodo(todo.id)} className="opacity-0 group-hover:opacity-100 btn-ghost !p-0.5 text-fg-tertiary hover:text-accent-warm"><Trash2 size={10} /></button>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

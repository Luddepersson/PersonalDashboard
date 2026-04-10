"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Check, ListTodo, Filter } from "lucide-react";

interface TodoItem { id: string; text: string; done: boolean; }
type FilterMode = "all" | "active" | "done";

export default function TodosPage() {
  const [mounted, setMounted] = useState(false);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("dashboard-todos");
    if (saved) { try { setTodos(JSON.parse(saved)); } catch {} }
  }, []);

  function save(updated: TodoItem[]) {
    setTodos(updated);
    localStorage.setItem("dashboard-todos", JSON.stringify(updated));
  }

  function addTodo() {
    if (!input.trim()) return;
    save([{ id: Date.now().toString(), text: input.trim(), done: false }, ...todos]);
    setInput("");
  }

  function toggleTodo(id: string) {
    save(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function removeTodo(id: string) {
    save(todos.filter((t) => t.id !== id));
  }

  function clearDone() {
    save(todos.filter((t) => !t.done));
  }

  if (!mounted) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="h-8 w-48 rounded bg-separator animate-pulse" />
          <div className="h-4 w-64 rounded bg-separator animate-pulse mt-3" />
        </div>
        <div className="h-12 rounded-xl bg-separator animate-pulse mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-separator animate-pulse" />)}
        </div>
      </div>
    );
  }

  const doneCount = todos.filter((t) => t.done).length;
  const progress = todos.length > 0 ? (doneCount / todos.length) * 100 : 0;
  const filtered = todos.filter((t) => {
    if (filter === "active") return !t.done;
    if (filter === "done") return t.done;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tighter">Uppgifter</h1>
        <p className="text-sm text-fg-secondary mt-1.5">Hantera dina att-gora-listor</p>
      </div>

      {/* Add Input */}
      <div className="glass p-4 sm:p-6 mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Lagg till en ny uppgift..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTodo()}
            className="input-base flex-1 !py-3 !text-base"
          />
          <button onClick={addTodo} className="btn-primary !py-3 !px-6 !rounded-xl flex items-center gap-2 text-sm font-medium">
            <Plus size={18} /> Lagg till
          </button>
        </div>
      </div>

      {/* Progress & Filters */}
      {todos.length > 0 && (
        <div className="mb-6 space-y-4">
          {/* Progress bar */}
          <div className="glass p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-fg-secondary font-medium">Framsteg</span>
              <span className="text-sm text-fg-tertiary">{doneCount} av {todos.length} klara</span>
            </div>
            <div className="h-2.5 bg-separator rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Filter buttons */}
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-fg-tertiary" />
            {([
              { key: "all" as FilterMode, label: "Alla", count: todos.length },
              { key: "active" as FilterMode, label: "Aktiva", count: todos.length - doneCount },
              { key: "done" as FilterMode, label: "Klara", count: doneCount },
            ]).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === f.key
                    ? "bg-accent/15 text-accent"
                    : "text-fg-tertiary hover:text-fg-secondary hover:bg-surface/50"
                }`}
              >
                {f.label} ({f.count})
              </button>
            ))}
            {doneCount > 0 && (
              <button
                onClick={clearDone}
                className="ml-auto text-xs text-fg-tertiary hover:text-accent-warm transition-colors"
              >
                Rensa klara
              </button>
            )}
          </div>
        </div>
      )}

      {/* Task List */}
      {filtered.length === 0 && todos.length === 0 && (
        <div className="glass p-12 text-center">
          <ListTodo size={40} className="text-fg-tertiary/30 mx-auto mb-4" />
          <p className="text-base text-fg-tertiary">Inga uppgifter annu</p>
          <p className="text-sm text-fg-tertiary/60 mt-1">Borja med att lagga till din forsta uppgift ovan</p>
        </div>
      )}

      {filtered.length === 0 && todos.length > 0 && (
        <div className="glass p-8 text-center">
          <p className="text-sm text-fg-tertiary">Inga uppgifter matchar filtret</p>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((todo) => (
          <div
            key={todo.id}
            className={`glass flex items-center gap-4 p-4 sm:p-5 transition-all ${
              todo.done ? "opacity-50" : ""
            }`}
          >
            <button
              onClick={() => toggleTodo(todo.id)}
              className={`shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                todo.done
                  ? "bg-accent border-accent text-white"
                  : "border-fg-tertiary/30 hover:border-accent"
              }`}
            >
              {todo.done && <Check size={14} strokeWidth={3} />}
            </button>
            <span className={`flex-1 text-base ${
              todo.done ? "line-through text-fg-tertiary" : "text-foreground"
            }`}>
              {todo.text}
            </span>
            <button
              onClick={() => removeTodo(todo.id)}
              className="opacity-0 group-hover:opacity-100 btn-ghost p-2 text-fg-tertiary hover:text-accent-warm rounded-lg transition-all hover:opacity-100"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

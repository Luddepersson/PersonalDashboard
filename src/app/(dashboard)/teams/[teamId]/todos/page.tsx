"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import GlassCard from "@/components/GlassCard";
import {
  ArrowLeft,
  Loader2,
  Plus,
  CheckSquare,
  Square,
  AlertCircle,
} from "lucide-react";

interface Todo {
  id: string;
  text: string;
  done: boolean;
  user_id: string;
  team_id: string;
  created_at: string;
  updated_at?: string;
  profile?: { name: string };
}

export default function TeamTodosPage() {
  const params = useParams();
  const teamId = params.teamId as string;

  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newText, setNewText] = useState("");
  const [adding, setAdding] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchTodos = useCallback(async () => {
    if (!teamId) return;
    try {
      const res = await fetch(`/api/teams/${teamId}/todos`);
      if (!res.ok) throw new Error("Kunde inte ladda uppgifter");
      const data = await res.json();
      setTodos(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ett oväntat fel uppstod");
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    const text = newText.trim();
    if (!text) return;

    setAdding(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("Kunde inte skapa uppgift");
      const created = await res.json();
      setTodos((prev) => [created, ...prev]);
      setNewText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte skapa uppgift");
    } finally {
      setAdding(false);
    }
  }

  async function toggleTodo(todo: Todo) {
    setTogglingId(todo.id);
    const newDone = !todo.done;

    // Optimistic update
    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? { ...t, done: newDone } : t))
    );

    try {
      const res = await fetch(`/api/teams/${teamId}/todos`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: todo.id, done: newDone }),
      });
      if (!res.ok) {
        // Revert on failure
        setTodos((prev) =>
          prev.map((t) => (t.id === todo.id ? { ...t, done: !newDone } : t))
        );
      }
    } catch {
      setTodos((prev) =>
        prev.map((t) => (t.id === todo.id ? { ...t, done: !newDone } : t))
      );
    } finally {
      setTogglingId(null);
    }
  }

  const activeTodos = todos.filter((t) => !t.done);
  const doneTodos = todos.filter((t) => t.done);

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("sv-SE", {
      day: "numeric",
      month: "short",
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
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/teams/${teamId}/dashboard`} className="btn-ghost !p-2">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground tracking-tight">Uppgifter</h1>
          <p className="text-xs text-fg-tertiary mt-0.5">
            {todos.length} uppgifter totalt, {activeTodos.length} aktiva
          </p>
        </div>
        <CheckSquare size={18} className="text-accent shrink-0" />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
          <AlertCircle size={14} className="text-red-400 shrink-0" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Add todo form */}
      <GlassCard className="mb-6" hover3d={false}>
        <form onSubmit={addTodo} className="flex gap-2">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            className="input-base flex-1"
            placeholder="Lägg till en ny uppgift..."
            disabled={adding}
          />
          <button
            type="submit"
            disabled={adding || !newText.trim()}
            className="btn-primary flex items-center gap-1.5 whitespace-nowrap"
          >
            {adding ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}
            Lägg till
          </button>
        </form>
      </GlassCard>

      {/* Active todos */}
      {activeTodos.length > 0 && (
        <div className="space-y-2 mb-8">
          {activeTodos.map((todo) => (
            <GlassCard key={todo.id} className="!p-3" hover3d={false}>
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleTodo(todo)}
                  disabled={togglingId === todo.id}
                  className="mt-0.5 text-fg-tertiary hover:text-accent transition-colors shrink-0"
                >
                  {togglingId === todo.id ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Square size={18} />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-relaxed">{todo.text}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {todo.profile?.name && (
                      <span className="text-[10px] text-fg-tertiary">
                        {todo.profile.name}
                      </span>
                    )}
                    <span className="text-[10px] text-fg-tertiary">
                      {formatDate(todo.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Done todos */}
      {doneTodos.length > 0 && (
        <div>
          <p className="text-xs font-medium text-fg-tertiary uppercase tracking-wide mb-3">
            Klara ({doneTodos.length})
          </p>
          <div className="space-y-2 opacity-50">
            {doneTodos.map((todo) => (
              <GlassCard key={todo.id} className="!p-3" hover3d={false}>
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleTodo(todo)}
                    disabled={togglingId === todo.id}
                    className="mt-0.5 text-accent shrink-0"
                  >
                    {togglingId === todo.id ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <CheckSquare size={18} />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-fg-secondary line-through leading-relaxed">
                      {todo.text}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {todo.profile?.name && (
                        <span className="text-[10px] text-fg-tertiary">
                          {todo.profile.name}
                        </span>
                      )}
                      <span className="text-[10px] text-fg-tertiary">
                        {formatDate(todo.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {todos.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <CheckSquare size={32} className="text-fg-tertiary opacity-40" />
          <p className="text-sm text-fg-tertiary">Inga uppgifter ännu. Skapa den första!</p>
        </div>
      )}
    </div>
  );
}

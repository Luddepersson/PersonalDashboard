"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, Plus, ArrowRight, Crown, UserPlus, X } from "lucide-react";
import GlassCard from "@/components/GlassCard";

interface Team {
  id: string;
  name: string;
  slug: string;
  role: string;
  member_count: number;
  created_at: string;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => { fetchTeams(); }, []);

  async function fetchTeams() {
    try {
      const res = await fetch("/api/teams");
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
      }
    } catch {} finally { setLoading(false); }
  }

  async function createTeam() {
    if (!newName.trim()) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.ok) {
        const team = await res.json();
        setNewName("");
        setShowCreate(false);
        router.push(`/teams/${team.id}/dashboard`);
      } else {
        const data = await res.json();
        setError(data.error || "Något gick fel");
      }
    } catch { setError("Något gick fel"); }
    setCreating(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Teams</h1>
          <p className="text-sm text-fg-secondary mt-0.5">Samarbeta med ditt team</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary flex items-center gap-2">
          {showCreate ? <X size={15} /> : <Plus size={15} />}
          {showCreate ? "Avbryt" : "Nytt team"}
        </button>
      </div>

      {/* Create team form */}
      {showCreate && (
        <GlassCard className="mb-6 animate-in" hover3d={false}>
          <h3 className="text-sm font-medium text-foreground mb-3">Skapa nytt team</h3>
          {error && <p className="text-sm text-accent-warm mb-3">{error}</p>}
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createTeam()}
              className="input-base flex-1"
              placeholder="Teamnamn..."
              autoFocus
            />
            <button onClick={createTeam} disabled={creating || !newName.trim()} className="btn-primary flex items-center gap-2">
              <UserPlus size={15} />
              {creating ? "Skapar..." : "Skapa"}
            </button>
          </div>
        </GlassCard>
      )}

      {/* Teams list */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="glass p-6 animate-pulse">
              <div className="h-5 w-32 bg-fg-tertiary/20 rounded mb-3" />
              <div className="h-3 w-48 bg-fg-tertiary/10 rounded" />
            </div>
          ))}
        </div>
      ) : teams.length === 0 ? (
        <GlassCard className="text-center py-12" hover3d={false}>
          <div className="w-16 h-16 rounded-2xl bg-accent-subtle flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-accent" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">Inga teams ännu</h3>
          <p className="text-sm text-fg-secondary mb-4 max-w-sm mx-auto">
            Skapa ett team för att börja samarbeta med kollegor. Dela anteckningar, uppgifter och chatta i realtid.
          </p>
          <button onClick={() => setShowCreate(true)} className="btn-primary inline-flex items-center gap-2">
            <Plus size={15} /> Skapa ditt första team
          </button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => router.push(`/teams/${team.id}/dashboard`)}
              className="glass p-5 text-left group hover:scale-[1.01] transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-accent-subtle flex items-center justify-center">
                  <Users size={18} className="text-accent" />
                </div>
                <div className="flex items-center gap-1.5">
                  {team.role === "owner" && (
                    <span className="badge flex items-center gap-1">
                      <Crown size={9} /> Ägare
                    </span>
                  )}
                </div>
              </div>

              <h3 className="text-base font-semibold text-foreground mb-1 group-hover:text-accent transition-colors">
                {team.name}
              </h3>

              <div className="flex items-center justify-between">
                <p className="text-xs text-fg-tertiary">
                  {team.member_count} {team.member_count === 1 ? "medlem" : "medlemmar"}
                </p>
                <ArrowRight size={14} className="text-fg-tertiary group-hover:text-accent group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

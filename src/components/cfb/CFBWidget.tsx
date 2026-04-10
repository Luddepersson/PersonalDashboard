"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Trophy, ChevronRight, RefreshCw, Search } from "lucide-react";
import GlassCard from "../GlassCard";

/* ───────── types ───────── */

interface CFBTeam {
  id: string;
  abbr: string;
  name: string;
  displayName: string;
  color: string;
  logo: string;
  conference: string;
}

interface GameInfo {
  opponent: string;
  opponentFull: string;
  opponentId: string;
  teamScore: number;
  oppScore: number;
  won: boolean;
  date: string;
  homeAway: string;
}

interface NextGameInfo {
  opponent: string;
  opponentAbbr: string;
  opponentId: string;
  date: string;
  time: string;
  homeAway: string;
}

interface TeamData {
  wins: number;
  losses: number;
  recentGames: GameInfo[];
  nextGame: NextGameInfo | null;
  ranking: number | null;
}

interface CacheEntry {
  data: TeamData;
  timestamp: number;
}

/* ───────── constants ───────── */

const CACHE_DURATION = 5 * 60 * 1000;
const LS_KEY = "dashboard-cfb-team";

function cfbLogo(teamId: string, size = 40) {
  return `https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/${teamId}.png&h=${size}&w=${size}`;
}

/* ───────── helpers ───────── */

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const days = ["Son", "Man", "Tis", "Ons", "Tor", "Fre", "Lor"];
  const months = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
}

/* ───────── API fetcher ───────── */

async function fetchTeamData(teamId: string): Promise<TeamData> {
  const [schedRes, rankRes] = await Promise.all([
    fetch(`https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/${teamId}/schedule`),
    fetch(`https://site.api.espn.com/apis/site/v2/sports/football/college-football/rankings`),
  ]);

  if (!schedRes.ok) throw new Error("ESPN API error");

  const schedJson = await schedRes.json();
  const now = new Date();
  const recentGames: GameInfo[] = [];
  let nextGame: NextGameInfo | null = null;
  let wins = 0, losses = 0;

  try {
    const record = schedJson.team?.record?.items?.[0];
    if (record) {
      const stats = record.stats;
      wins = stats?.find((s: { name: string; value: number }) => s.name === "wins")?.value ?? 0;
      losses = stats?.find((s: { name: string; value: number }) => s.name === "losses")?.value ?? 0;
    }
  } catch { /* fallback */ }

  const events = schedJson.events ?? [];
  for (const event of events) {
    const comp = event.competitions?.[0];
    if (!comp) continue;
    const gameDate = new Date(event.date);
    const competitors = comp.competitors ?? [];
    const teamEntry = competitors.find((c: { id: string }) => c.id === String(teamId));
    const oppEntry = competitors.find((c: { id: string }) => c.id !== String(teamId));
    if (!teamEntry || !oppEntry) continue;

    const oppAbbr = oppEntry.team?.abbreviation ?? "???";
    const oppName = oppEntry.team?.shortDisplayName ?? oppAbbr;
    const oppId = oppEntry.team?.id ?? "";
    const homeAway = teamEntry.homeAway === "home" ? "vs" : "@";
    const completed = comp.status?.type?.completed ?? event.status?.type?.completed ?? false;

    if (completed && gameDate <= now) {
      const teamScore = parseInt(teamEntry.score?.value ?? teamEntry.score ?? "0", 10);
      const oppScore = parseInt(oppEntry.score?.value ?? oppEntry.score ?? "0", 10);
      recentGames.push({
        opponent: oppAbbr, opponentFull: oppName, opponentId: oppId,
        teamScore, oppScore, won: teamScore > oppScore,
        date: formatDate(event.date), homeAway,
      });
    } else if (!completed && gameDate > now && !nextGame) {
      const sixMonths = 6 * 30 * 24 * 60 * 60 * 1000;
      if (gameDate.getTime() - now.getTime() < sixMonths) {
        nextGame = { opponent: oppName, opponentAbbr: oppAbbr, opponentId: oppId, date: formatDate(event.date), time: formatTime(event.date), homeAway };
      }
    }
  }

  recentGames.reverse();

  if (wins === 0 && losses === 0 && recentGames.length > 0) {
    wins = recentGames.filter((g) => g.won).length;
    losses = recentGames.filter((g) => !g.won).length;
  }

  let ranking: number | null = null;
  try {
    if (rankRes.ok) {
      const rankJson = await rankRes.json();
      for (const poll of (rankJson.rankings ?? [])) {
        for (const rank of (poll.ranks ?? [])) {
          if (rank.team?.id === String(teamId)) {
            ranking = rank.current ?? null;
            break;
          }
        }
        if (ranking) break;
      }
    }
  } catch { /* optional */ }

  return { wins, losses, recentGames: recentGames.slice(0, 3), nextGame, ranking };
}

/* ───────── component ───────── */

export default function CFBWidget() {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedTeamInfo, setSelectedTeamInfo] = useState<CFBTeam | null>(null);
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [teams, setTeams] = useState<CFBTeam[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const mountedRef = useRef(true);
  const cacheRef = useRef<Record<string, CacheEntry>>({});

  useEffect(() => {
    mountedRef.current = true;
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.id) {
          setSelectedTeamId(parsed.id);
          setSelectedTeamInfo(parsed);
        } else {
          // Legacy: old format stored abbr string
          localStorage.removeItem(LS_KEY);
        }
      }
    } catch {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) localStorage.removeItem(LS_KEY);
    }
    setMounted(true);
    return () => { mountedRef.current = false; };
  }, []);

  // Fetch teams on mount
  useEffect(() => {
    if (!mounted) return;
    async function loadTeams() {
      setTeamsLoading(true);
      try {
        const res = await fetch("https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams?limit=200");
        if (!res.ok) throw new Error("Failed to load teams");
        const json = await res.json();
        const parsed: CFBTeam[] = (json.sports?.[0]?.leagues?.[0]?.teams ?? []).map((t: Record<string, unknown>) => {
          const team = t.team as Record<string, unknown>;
          return {
            id: String(team.id ?? ""),
            abbr: (team.abbreviation as string) ?? "",
            name: (team.shortDisplayName as string) ?? (team.displayName as string) ?? "",
            displayName: (team.displayName as string) ?? "",
            color: team.color ? `#${team.color}` : "#666",
            logo: ((team.logos as Array<Record<string, string>>)?.[0]?.href) ?? "",
            conference: (((team as Record<string, unknown>).groups as Record<string, unknown>)?.name as string) ?? "",
          };
        }).filter((t: CFBTeam) => t.id);
        if (mountedRef.current) setTeams(parsed);
      } catch {
        // Keep empty
      } finally {
        if (mountedRef.current) setTeamsLoading(false);
      }
    }
    if (!selectedTeamId) loadTeams();
  }, [mounted, selectedTeamId]);

  const selectTeam = (team: CFBTeam) => {
    setSelectedTeamId(team.id);
    setSelectedTeamInfo(team);
    localStorage.setItem(LS_KEY, JSON.stringify(team));
  };

  const loadData = useCallback(async (force = false) => {
    if (!selectedTeamId) return;
    const cached = cacheRef.current[selectedTeamId];
    if (!force && cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setData(cached.data);
      setLastUpdated(new Date(cached.timestamp).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" }));
      return;
    }
    setLoading(true); setError(null);
    try {
      const result = await fetchTeamData(selectedTeamId);
      if (!mountedRef.current) return;
      cacheRef.current[selectedTeamId] = { data: result, timestamp: Date.now() };
      setData(result);
      setLastUpdated(new Date().toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" }));
    } catch {
      if (mountedRef.current) setError("Kunde inte hamta data");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [selectedTeamId]);

  useEffect(() => {
    if (selectedTeamId) loadData();
  }, [selectedTeamId, loadData]);

  /* ── loading state ── */

  if (!mounted) {
    return (
      <GlassCard className="flex items-center justify-center h-[280px]">
        <div className="h-8 w-8 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
      </GlassCard>
    );
  }

  /* ── team picker ── */

  if (!selectedTeamId) {
    const filtered = searchQuery.trim()
      ? teams.filter(t =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.abbr.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.displayName.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : teams.slice(0, 20);

    return (
      <GlassCard className="flex flex-col h-[280px]">
        <div className="flex items-center gap-2 mb-2">
          <Trophy size={16} className="text-accent" />
          <h3 className="text-sm font-semibold text-foreground">CFB -- Valj lag</h3>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-surface/40 mb-2">
          <Search size={11} className="text-fg-tertiary shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Sok lag..."
            className="w-full bg-transparent border-none text-[11px] text-foreground placeholder-fg-tertiary focus:outline-none"
          />
        </div>
        {teamsLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="h-6 w-6 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 overflow-y-auto flex-1 pr-1">
            {filtered.map((t) => (
              <button
                key={t.id}
                onClick={() => selectTeam(t)}
                className="btn-ghost text-[10px] font-bold py-1.5 px-1 rounded-lg text-center hover:scale-105 transition-transform flex flex-col items-center gap-1"
              >
                <img src={cfbLogo(t.id)} alt={t.name} className="w-6 h-6 object-contain" />
                <span className="text-foreground truncate w-full">{t.abbr}</span>
              </button>
            ))}
          </div>
        )}
      </GlassCard>
    );
  }

  /* ── team view ── */

  return (
    <GlassCard className="flex flex-col h-[280px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <img src={cfbLogo(selectedTeamId)} alt={selectedTeamInfo?.name ?? ""} className="w-8 h-8 object-contain" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">{selectedTeamInfo?.name ?? "Team"}</h3>
            <p className="text-[10px] text-fg-tertiary">
              CFB
              {data?.ranking && <span className="ml-1 text-accent font-bold">#{data.ranking}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data && (
            <span className="text-xs font-mono font-bold text-foreground bg-surface px-2 py-0.5 rounded">
              {data.wins}-{data.losses}
            </span>
          )}
          <button onClick={() => loadData(true)} disabled={loading} className="btn-ghost p-1 rounded" title="Uppdatera">
            <RefreshCw size={12} className={`text-fg-tertiary ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && <div className="text-[11px] text-red-400 text-center py-2">{error}</div>}

      {loading && !data && (
        <div className="flex-1 flex items-center justify-center">
          <div className="h-6 w-6 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
        </div>
      )}

      {data && (
        <>
          {/* Next game */}
          {data.nextGame ? (
            <div className="bg-surface rounded-lg px-3 py-2 mb-2">
              <p className="text-[10px] text-fg-tertiary uppercase tracking-wider mb-1">Nasta match</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {data.nextGame.opponentId && (
                    <img src={cfbLogo(data.nextGame.opponentId, 24)} alt="" className="w-4 h-4 object-contain" />
                  )}
                  <span className="text-xs text-foreground font-medium">{data.nextGame.homeAway} {data.nextGame.opponent}</span>
                </div>
                <div className="flex items-center gap-1 text-fg-secondary">
                  <span className="text-[11px]">{data.nextGame.date} &bull; {data.nextGame.time}</span>
                  <ChevronRight size={12} />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface rounded-lg px-3 py-2 mb-2">
              <p className="text-[11px] text-fg-secondary font-medium">Off-season</p>
              <p className="text-[10px] text-fg-tertiary">Sasongen borjar i augusti/september</p>
            </div>
          )}

          {/* Recent results */}
          <div className="flex-1 min-h-0">
            <p className="text-[10px] text-fg-tertiary uppercase tracking-wider mb-1.5">Senaste resultat</p>
            {data.recentGames.length === 0 ? (
              <p className="text-[11px] text-fg-tertiary px-2">Inga resultat att visa</p>
            ) : (
              <div className="space-y-1">
                {data.recentGames.map((game, i) => (
                  <div key={i} className="flex items-center justify-between px-2 py-1 rounded bg-surface/40">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold w-4 text-center ${game.won ? "text-emerald-400" : "text-red-400"}`}>
                        {game.won ? "W" : "L"}
                      </span>
                      {game.opponentId && (
                        <img src={cfbLogo(game.opponentId, 24)} alt="" className="w-4 h-4 object-contain" />
                      )}
                      <span className="text-xs text-foreground">{game.homeAway} {game.opponent}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-fg-secondary">{game.teamScore}-{game.oppScore}</span>
                      <span className="text-[10px] text-fg-tertiary">{game.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2">
        <button
          onClick={() => { setSelectedTeamId(null); setSelectedTeamInfo(null); setData(null); setError(null); localStorage.removeItem(LS_KEY); }}
          className="btn-ghost text-[11px] text-fg-tertiary"
        >
          Byt lag
        </button>
        {lastUpdated && (
          <span className="text-[10px] text-fg-tertiary">Uppdaterad: {lastUpdated}</span>
        )}
      </div>
    </GlassCard>
  );
}

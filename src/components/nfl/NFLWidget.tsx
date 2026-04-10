"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Trophy, ChevronRight, RefreshCw } from "lucide-react";
import GlassCard from "../GlassCard";

interface NFLTeam {
  abbr: string;
  name: string;
  color: string;
  espnId: number;
}

const NFL_TEAMS: NFLTeam[] = [
  { abbr: "KC", name: "Chiefs", color: "#E31837", espnId: 12 },
  { abbr: "SF", name: "49ers", color: "#AA0000", espnId: 25 },
  { abbr: "PHI", name: "Eagles", color: "#004C54", espnId: 21 },
  { abbr: "DAL", name: "Cowboys", color: "#003594", espnId: 6 },
  { abbr: "BUF", name: "Bills", color: "#00338D", espnId: 2 },
  { abbr: "BAL", name: "Ravens", color: "#241773", espnId: 33 },
  { abbr: "MIA", name: "Dolphins", color: "#008E97", espnId: 15 },
  { abbr: "DET", name: "Lions", color: "#0076B6", espnId: 8 },
  { abbr: "CIN", name: "Bengals", color: "#FB4F14", espnId: 4 },
  { abbr: "MIN", name: "Vikings", color: "#4F2683", espnId: 16 },
  { abbr: "GB", name: "Packers", color: "#203731", espnId: 9 },
  { abbr: "SEA", name: "Seahawks", color: "#002244", espnId: 26 },
  { abbr: "LAR", name: "Rams", color: "#003594", espnId: 14 },
  { abbr: "NYG", name: "Giants", color: "#0B2265", espnId: 19 },
  { abbr: "NYJ", name: "Jets", color: "#125740", espnId: 20 },
  { abbr: "NE", name: "Patriots", color: "#002244", espnId: 17 },
  { abbr: "PIT", name: "Steelers", color: "#FFB612", espnId: 23 },
  { abbr: "JAX", name: "Jaguars", color: "#006778", espnId: 30 },
  { abbr: "LAC", name: "Chargers", color: "#0080C6", espnId: 24 },
  { abbr: "TB", name: "Buccaneers", color: "#D50A0A", espnId: 27 },
];

interface GameInfo {
  opponent: string;
  teamScore: number;
  oppScore: number;
  won: boolean;
  date: string;
  homeAway: string;
}

interface NextGameInfo {
  opponent: string;
  opponentAbbr: string;
  date: string;
  time: string;
  homeAway: string;
}

interface TeamData {
  wins: number;
  losses: number;
  recentGames: GameInfo[];
  nextGame: NextGameInfo | null;
}

interface CacheEntry {
  data: TeamData;
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const LS_KEY = "dashboard-nfl-team";

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

async function fetchTeamData(team: NFLTeam): Promise<TeamData> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${team.espnId}/schedule`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("ESPN API error");
  const json = await res.json();

  const now = new Date();
  const recentGames: GameInfo[] = [];
  let nextGame: NextGameInfo | null = null;

  // Extract record from team info
  let wins = 0;
  let losses = 0;
  try {
    const record = json.team?.record?.items?.[0];
    if (record) {
      const stats = record.stats;
      wins = stats?.find((s: { name: string; value: number }) => s.name === "wins")?.value ?? 0;
      losses = stats?.find((s: { name: string; value: number }) => s.name === "losses")?.value ?? 0;
    }
  } catch {
    // Fallback: count from events
  }

  const events = json.events ?? [];
  for (const event of events) {
    const comp = event.competitions?.[0];
    if (!comp) continue;

    const gameDate = new Date(event.date);
    const competitors = comp.competitors ?? [];
    const teamEntry = competitors.find(
      (c: { id: string }) => c.id === String(team.espnId)
    );
    const oppEntry = competitors.find(
      (c: { id: string }) => c.id !== String(team.espnId)
    );
    if (!teamEntry || !oppEntry) continue;

    const oppAbbr = oppEntry.team?.abbreviation ?? "???";
    const oppName = oppEntry.team?.shortDisplayName ?? oppAbbr;
    const homeAway = teamEntry.homeAway === "home" ? "vs" : "@";

    const status = comp.status?.type?.completed ?? event.status?.type?.completed;

    if (status && gameDate <= now) {
      // Completed game
      const teamScore = parseInt(teamEntry.score?.value ?? teamEntry.score ?? "0", 10);
      const oppScore = parseInt(oppEntry.score?.value ?? oppEntry.score ?? "0", 10);
      recentGames.push({
        opponent: oppAbbr,
        teamScore,
        oppScore,
        won: teamScore > oppScore,
        date: formatDate(event.date),
        homeAway,
      });
    } else if (!status && gameDate > now && !nextGame) {
      // Only show next game if it's within 6 months (avoid showing far-future preseason)
      const sixMonths = 6 * 30 * 24 * 60 * 60 * 1000;
      if (gameDate.getTime() - now.getTime() < sixMonths) {
        nextGame = {
          opponent: oppName,
          opponentAbbr: oppAbbr,
          date: formatDate(event.date),
          time: formatTime(event.date),
          homeAway,
        };
      }
    }
  }

  // Sort recent games by date descending, take last 3
  recentGames.reverse();
  const lastThree = recentGames.slice(0, 3);

  // If we didn't extract wins/losses from record, count from games
  if (wins === 0 && losses === 0 && recentGames.length > 0) {
    wins = recentGames.filter((g) => g.won).length;
    losses = recentGames.filter((g) => !g.won).length;
  }

  return { wins, losses, recentGames: lastThree, nextGame };
}

export default function NFLWidget() {
  const [selectedAbbr, setSelectedAbbr] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const cacheRef = useRef<Record<string, CacheEntry>>({});

  useEffect(() => {
    mountedRef.current = true;
    const stored = localStorage.getItem(LS_KEY);
    if (stored) setSelectedAbbr(stored);
    setMounted(true);
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (selectedAbbr) {
      localStorage.setItem(LS_KEY, selectedAbbr);
    } else {
      localStorage.removeItem(LS_KEY);
    }
  }, [selectedAbbr, mounted]);

  const team = NFL_TEAMS.find((t) => t.abbr === selectedAbbr) ?? null;

  const loadData = useCallback(
    async (force = false) => {
      if (!team) return;
      const cached = cacheRef.current[team.abbr];
      if (!force && cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setData(cached.data);
        setLastUpdated(
          new Date(cached.timestamp).toLocaleTimeString("sv-SE", {
            hour: "2-digit",
            minute: "2-digit",
          })
        );
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const result = await fetchTeamData(team);
        if (!mountedRef.current) return;
        cacheRef.current[team.abbr] = { data: result, timestamp: Date.now() };
        setData(result);
        setLastUpdated(
          new Date().toLocaleTimeString("sv-SE", {
            hour: "2-digit",
            minute: "2-digit",
          })
        );
      } catch {
        if (!mountedRef.current) return;
        setError("Kunde inte hamta data");
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [team]
  );

  useEffect(() => {
    if (team) loadData();
  }, [team, loadData]);

  if (!mounted) {
    return (
      <GlassCard className="flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
      </GlassCard>
    );
  }

  if (!team) {
    return (
      <GlassCard className="flex flex-col h-[280px]">
        <div className="flex items-center gap-2 mb-3">
          <Trophy size={16} className="text-accent" />
          <h3 className="text-sm font-semibold text-foreground">
            NFL — Valj lag
          </h3>
        </div>
        <div className="grid grid-cols-5 gap-1.5 overflow-y-auto flex-1 pr-1">
          {NFL_TEAMS.map((t) => (
            <button
              key={t.abbr}
              onClick={() => setSelectedAbbr(t.abbr)}
              className="btn-ghost text-[11px] font-bold py-1.5 px-1 rounded-lg text-center hover:scale-105 transition-transform flex flex-col items-center gap-1"
            >
              <img src={`https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/${t.espnId}.png&h=40&w=40`} alt={t.name} className="w-6 h-6 object-contain" />
              <span className="text-foreground">{t.abbr}</span>
            </button>
          ))}
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="flex flex-col h-[280px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <img src={`https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/${team.espnId}.png&h=40&w=40`} alt={team.name} className="w-8 h-8 object-contain" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {team.name}
            </h3>
            <p className="text-[10px] text-fg-tertiary">NFL &bull; {team.abbr}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data && (
            <span className="text-xs font-mono font-bold text-foreground bg-surface px-2 py-0.5 rounded">
              {data.wins}-{data.losses}
            </span>
          )}
          <button
            onClick={() => loadData(true)}
            disabled={loading}
            className="btn-ghost p-1 rounded"
            title="Uppdatera"
          >
            <RefreshCw
              size={12}
              className={`text-fg-tertiary ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {error && (
        <div className="text-[11px] text-red-400 text-center py-2">
          {error}
        </div>
      )}

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
              <p className="text-[10px] text-fg-tertiary uppercase tracking-wider mb-1">
                Nasta match
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground font-medium">
                  {data.nextGame.homeAway} {data.nextGame.opponent}
                </span>
                <div className="flex items-center gap-1 text-fg-secondary">
                  <span className="text-[11px]">
                    {data.nextGame.date} &bull; {data.nextGame.time}
                  </span>
                  <ChevronRight size={12} />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface rounded-lg px-3 py-2 mb-2">
              <p className="text-[11px] text-fg-secondary font-medium">🏈 Off-season</p>
              <p className="text-[10px] text-fg-tertiary">Säsongen börjar i september</p>
            </div>
          )}

          {/* Recent results */}
          <div className="flex-1 min-h-0">
            <p className="text-[10px] text-fg-tertiary uppercase tracking-wider mb-1.5">
              Senaste resultat
            </p>
            {data.recentGames.length === 0 ? (
              <p className="text-[11px] text-fg-tertiary px-2">
                Inga resultat att visa
              </p>
            ) : (
              <div className="space-y-1">
                {data.recentGames.map((game, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-2 py-1 rounded bg-surface/40"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold w-4 text-center ${
                          game.won ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {game.won ? "W" : "L"}
                      </span>
                      <span className="text-xs text-foreground">
                        {game.homeAway} {game.opponent}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-fg-secondary">
                        {game.teamScore}-{game.oppScore}
                      </span>
                      <span className="text-[10px] text-fg-tertiary">
                        {game.date}
                      </span>
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
          onClick={() => {
            setSelectedAbbr(null);
            setData(null);
            setError(null);
          }}
          className="btn-ghost text-[11px] text-fg-tertiary"
        >
          Byt lag
        </button>
        {lastUpdated && (
          <span className="text-[10px] text-fg-tertiary">
            Uppdaterad: {lastUpdated}
          </span>
        )}
      </div>
    </GlassCard>
  );
}

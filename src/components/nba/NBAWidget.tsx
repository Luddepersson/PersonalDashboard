"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Trophy, ChevronRight, RefreshCw } from "lucide-react";
import GlassCard from "../GlassCard";

interface NBATeam {
  abbr: string;
  name: string;
  color: string;
  conference: "Western" | "Eastern";
  espnId: number;
}

const NBA_TEAMS: NBATeam[] = [
  { abbr: "LAL", name: "Lakers", color: "#552583", conference: "Western", espnId: 13 },
  { abbr: "BOS", name: "Celtics", color: "#007A33", conference: "Eastern", espnId: 2 },
  { abbr: "GSW", name: "Warriors", color: "#1D428A", conference: "Western", espnId: 9 },
  { abbr: "MIL", name: "Bucks", color: "#00471B", conference: "Eastern", espnId: 15 },
  { abbr: "DEN", name: "Nuggets", color: "#0E2240", conference: "Western", espnId: 7 },
  { abbr: "PHX", name: "Suns", color: "#1D1160", conference: "Western", espnId: 21 },
  { abbr: "MIA", name: "Heat", color: "#98002E", conference: "Eastern", espnId: 14 },
  { abbr: "NYK", name: "Knicks", color: "#006BB6", conference: "Eastern", espnId: 18 },
  { abbr: "PHI", name: "76ers", color: "#006BB6", conference: "Eastern", espnId: 20 },
  { abbr: "DAL", name: "Mavericks", color: "#00538C", conference: "Western", espnId: 6 },
  { abbr: "CLE", name: "Cavaliers", color: "#860038", conference: "Eastern", espnId: 5 },
  { abbr: "MEM", name: "Grizzlies", color: "#5D76A9", conference: "Western", espnId: 29 },
  { abbr: "SAC", name: "Kings", color: "#5A2D81", conference: "Western", espnId: 23 },
  { abbr: "OKC", name: "Thunder", color: "#007AC1", conference: "Western", espnId: 25 },
  { abbr: "MIN", name: "Timberwolves", color: "#0C2340", conference: "Western", espnId: 16 },
  { abbr: "ATL", name: "Hawks", color: "#E03A3E", conference: "Eastern", espnId: 1 },
  { abbr: "CHI", name: "Bulls", color: "#CE1141", conference: "Eastern", espnId: 4 },
  { abbr: "BKN", name: "Nets", color: "#000000", conference: "Eastern", espnId: 17 },
  { abbr: "LAC", name: "Clippers", color: "#C8102E", conference: "Western", espnId: 12 },
  { abbr: "IND", name: "Pacers", color: "#002D62", conference: "Eastern", espnId: 11 },
  { abbr: "TOR", name: "Raptors", color: "#CE1141", conference: "Eastern", espnId: 28 },
  { abbr: "HOU", name: "Rockets", color: "#CE1141", conference: "Western", espnId: 10 },
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
  confRank: number;
  conference: string;
}

interface CacheEntry {
  data: TeamData;
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const LS_KEY = "dashboard-nba-team";

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

async function fetchTeamData(team: NBATeam): Promise<TeamData> {
  // Fetch schedule and standings in parallel
  const [scheduleRes, standingsRes] = await Promise.all([
    fetch(
      `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${team.espnId}/schedule`
    ),
    fetch(
      `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/standings`
    ),
  ]);

  if (!scheduleRes.ok) throw new Error("ESPN API error");

  const scheduleJson = await scheduleRes.json();
  const now = new Date();
  const recentGames: GameInfo[] = [];
  let nextGame: NextGameInfo | null = null;

  // Extract record
  let wins = 0;
  let losses = 0;
  try {
    const record = scheduleJson.team?.record?.items?.[0];
    if (record) {
      const stats = record.stats;
      wins = stats?.find((s: { name: string; value: number }) => s.name === "wins")?.value ?? 0;
      losses = stats?.find((s: { name: string; value: number }) => s.name === "losses")?.value ?? 0;
    }
  } catch {
    // Will count from games if needed
  }

  const events = scheduleJson.events ?? [];
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

  // Sort recent games descending, take last 3
  recentGames.reverse();
  const lastThree = recentGames.slice(0, 3);

  if (wins === 0 && losses === 0 && recentGames.length > 0) {
    wins = recentGames.filter((g) => g.won).length;
    losses = recentGames.filter((g) => !g.won).length;
  }

  // Extract conference rank from standings
  let confRank = 0;
  try {
    if (standingsRes.ok) {
      const standingsJson = await standingsRes.json();
      const children = standingsJson.children ?? [];
      for (const conf of children) {
        const entries = conf.standings?.entries ?? [];
        for (const entry of entries) {
          if (entry.team?.id === String(team.espnId)) {
            const rankStat = entry.stats?.find(
              (s: { name: string }) =>
                s.name === "playoffSeed" || s.name === "rank"
            );
            confRank = rankStat?.value ?? 0;
            break;
          }
        }
        if (confRank > 0) break;
      }
    }
  } catch {
    // Standings are optional
  }

  return {
    wins,
    losses,
    recentGames: lastThree,
    nextGame,
    confRank,
    conference: team.conference,
  };
}

export default function NBAWidget() {
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

  const team = NBA_TEAMS.find((t) => t.abbr === selectedAbbr) ?? null;

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
            NBA — Valj lag
          </h3>
        </div>
        <div className="grid grid-cols-5 gap-1.5 overflow-y-auto flex-1 pr-1">
          {NBA_TEAMS.map((t) => (
            <button
              key={t.abbr}
              onClick={() => setSelectedAbbr(t.abbr)}
              className="btn-ghost text-[11px] font-bold py-1.5 px-1 rounded-lg text-center hover:scale-105 transition-transform flex flex-col items-center gap-1"
            >
              <img src={`https://a.espncdn.com/combiner/i?img=/i/teamlogos/nba/500/${t.espnId}.png&h=40&w=40`} alt={t.name} className="w-6 h-6 object-contain" />
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
          <img src={`https://a.espncdn.com/combiner/i?img=/i/teamlogos/nba/500/${team.espnId}.png&h=40&w=40`} alt={team.name} className="w-8 h-8 object-contain" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {team.name}
            </h3>
            <p className="text-[10px] text-fg-tertiary">NBA &bull; {team.abbr}</p>
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
          {/* Standings */}
          {data.confRank > 0 && (
            <div className="flex items-center gap-1.5 mb-2 px-2 py-1 rounded bg-surface/40">
              <Trophy size={12} className="text-accent" />
              <span className="text-[11px] text-fg-secondary">
                #{data.confRank} i {data.conference} Conference
              </span>
            </div>
          )}

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
              <p className="text-[11px] text-fg-secondary font-medium">🏀 Off-season</p>
              <p className="text-[10px] text-fg-tertiary">Säsongen börjar i oktober</p>
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

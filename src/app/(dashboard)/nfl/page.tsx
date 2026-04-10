"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Trophy,
  RefreshCw,
  ChevronRight,
  ExternalLink,
  Calendar,
  Clock,
  Star,
  ArrowLeft,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NFLTeam {
  abbr: string;
  name: string;
  fullName: string;
  color: string;
  espnId: number;
  conference: "AFC" | "NFC";
  division: string;
}

interface ScheduleGame {
  id: string;
  opponent: string;
  opponentAbbr: string;
  opponentColor: string;
  teamScore: number | null;
  oppScore: number | null;
  won: boolean | null;
  date: string;
  rawDate: string;
  time: string;
  homeAway: "vs" | "@";
  completed: boolean;
  week: number;
  statusText: string;
}

interface TeamScheduleData {
  wins: number;
  losses: number;
  ties: number;
  games: ScheduleGame[];
}

interface ScoreboardGame {
  id: string;
  homeTeam: { abbr: string; name: string; color: string; score: string; logo?: string };
  awayTeam: { abbr: string; name: string; color: string; score: string; logo?: string };
  status: "pre" | "in" | "post";
  statusDetail: string;
  date: string;
  time: string;
}

interface NewsArticle {
  id: string;
  headline: string;
  description: string;
  published: string;
  imageUrl: string | null;
  linkUrl: string;
}

interface StandingsEntry {
  teamAbbr: string;
  teamName: string;
  teamColor: string;
  espnId: number;
  wins: number;
  losses: number;
  ties: number;
  pct: string;
  division: string;
  conference: string;
}

// ---------------------------------------------------------------------------
// NFL Teams data (all 32)
// ---------------------------------------------------------------------------

const NFL_TEAMS: NFLTeam[] = [
  // AFC East
  { abbr: "BUF", name: "Bills", fullName: "Buffalo Bills", color: "#00338D", espnId: 2, conference: "AFC", division: "East" },
  { abbr: "MIA", name: "Dolphins", fullName: "Miami Dolphins", color: "#008E97", espnId: 15, conference: "AFC", division: "East" },
  { abbr: "NE", name: "Patriots", fullName: "New England Patriots", color: "#002244", espnId: 17, conference: "AFC", division: "East" },
  { abbr: "NYJ", name: "Jets", fullName: "New York Jets", color: "#125740", espnId: 20, conference: "AFC", division: "East" },
  // AFC North
  { abbr: "BAL", name: "Ravens", fullName: "Baltimore Ravens", color: "#241773", espnId: 33, conference: "AFC", division: "North" },
  { abbr: "CIN", name: "Bengals", fullName: "Cincinnati Bengals", color: "#FB4F14", espnId: 4, conference: "AFC", division: "North" },
  { abbr: "CLE", name: "Browns", fullName: "Cleveland Browns", color: "#311D00", espnId: 5, conference: "AFC", division: "North" },
  { abbr: "PIT", name: "Steelers", fullName: "Pittsburgh Steelers", color: "#FFB612", espnId: 23, conference: "AFC", division: "North" },
  // AFC South
  { abbr: "HOU", name: "Texans", fullName: "Houston Texans", color: "#03202F", espnId: 34, conference: "AFC", division: "South" },
  { abbr: "IND", name: "Colts", fullName: "Indianapolis Colts", color: "#002C5F", espnId: 11, conference: "AFC", division: "South" },
  { abbr: "JAX", name: "Jaguars", fullName: "Jacksonville Jaguars", color: "#006778", espnId: 30, conference: "AFC", division: "South" },
  { abbr: "TEN", name: "Titans", fullName: "Tennessee Titans", color: "#0C2340", espnId: 10, conference: "AFC", division: "South" },
  // AFC West
  { abbr: "DEN", name: "Broncos", fullName: "Denver Broncos", color: "#FB4F14", espnId: 7, conference: "AFC", division: "West" },
  { abbr: "KC", name: "Chiefs", fullName: "Kansas City Chiefs", color: "#E31837", espnId: 12, conference: "AFC", division: "West" },
  { abbr: "LV", name: "Raiders", fullName: "Las Vegas Raiders", color: "#000000", espnId: 13, conference: "AFC", division: "West" },
  { abbr: "LAC", name: "Chargers", fullName: "Los Angeles Chargers", color: "#0080C6", espnId: 24, conference: "AFC", division: "West" },
  // NFC East
  { abbr: "DAL", name: "Cowboys", fullName: "Dallas Cowboys", color: "#003594", espnId: 6, conference: "NFC", division: "East" },
  { abbr: "NYG", name: "Giants", fullName: "New York Giants", color: "#0B2265", espnId: 19, conference: "NFC", division: "East" },
  { abbr: "PHI", name: "Eagles", fullName: "Philadelphia Eagles", color: "#004C54", espnId: 21, conference: "NFC", division: "East" },
  { abbr: "WAS", name: "Commanders", fullName: "Washington Commanders", color: "#5A1414", espnId: 28, conference: "NFC", division: "East" },
  // NFC North
  { abbr: "CHI", name: "Bears", fullName: "Chicago Bears", color: "#0B162A", espnId: 3, conference: "NFC", division: "North" },
  { abbr: "DET", name: "Lions", fullName: "Detroit Lions", color: "#0076B6", espnId: 8, conference: "NFC", division: "North" },
  { abbr: "GB", name: "Packers", fullName: "Green Bay Packers", color: "#203731", espnId: 9, conference: "NFC", division: "North" },
  { abbr: "MIN", name: "Vikings", fullName: "Minnesota Vikings", color: "#4F2683", espnId: 16, conference: "NFC", division: "North" },
  // NFC South
  { abbr: "ATL", name: "Falcons", fullName: "Atlanta Falcons", color: "#A71930", espnId: 1, conference: "NFC", division: "South" },
  { abbr: "CAR", name: "Panthers", fullName: "Carolina Panthers", color: "#0085CA", espnId: 29, conference: "NFC", division: "South" },
  { abbr: "NO", name: "Saints", fullName: "New Orleans Saints", color: "#D3BC8D", espnId: 18, conference: "NFC", division: "South" },
  { abbr: "TB", name: "Buccaneers", fullName: "Tampa Bay Buccaneers", color: "#D50A0A", espnId: 27, conference: "NFC", division: "South" },
  // NFC West
  { abbr: "ARI", name: "Cardinals", fullName: "Arizona Cardinals", color: "#97233F", espnId: 22, conference: "NFC", division: "West" },
  { abbr: "LAR", name: "Rams", fullName: "Los Angeles Rams", color: "#003594", espnId: 14, conference: "NFC", division: "West" },
  { abbr: "SF", name: "49ers", fullName: "San Francisco 49ers", color: "#AA0000", espnId: 25, conference: "NFC", division: "West" },
  { abbr: "SEA", name: "Seahawks", fullName: "Seattle Seahawks", color: "#002244", espnId: 26, conference: "NFC", division: "West" },
];

const LS_KEY = "dashboard-nfl-team";
const CACHE_DURATION = 5 * 60 * 1000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  const days = ["Son", "Man", "Tis", "Ons", "Tor", "Fre", "Lor"];
  const months = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
}

function formatRelativeDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffH < 1) return "Just nu";
  if (diffH < 24) return `${diffH}h sedan`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "Igar";
  if (diffD < 7) return `${diffD} dagar sedan`;
  return formatDateShort(dateStr);
}

function getTeamByEspnId(id: number | string): NFLTeam | undefined {
  return NFL_TEAMS.find((t) => t.espnId === Number(id));
}

function Spinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const s = size === "sm" ? "h-5 w-5" : size === "lg" ? "h-10 w-10" : "h-7 w-7";
  return (
    <div className="flex items-center justify-center py-8">
      <div className={`${s} rounded-full border-2 border-accent/30 border-t-accent animate-spin`} />
    </div>
  );
}

function nflLogo(espnId: number | string, size = 40) {
  return `https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/${espnId}.png&h=${size}&w=${size}`;
}

function TeamBadge({ abbr, color, size = "md", espnId }: { abbr: string; color: string; size?: "sm" | "md" | "lg"; espnId?: number }) {
  const s = size === "sm" ? "w-6 h-6" : size === "lg" ? "w-10 h-10" : "w-8 h-8";
  const resolvedId = espnId ?? NFL_TEAMS.find(t => t.abbr === abbr)?.espnId;
  if (resolvedId) {
    return <img src={nflLogo(resolvedId, size === "lg" ? 80 : size === "sm" ? 32 : 40)} alt={abbr} className={`${s} object-contain shrink-0`} />;
  }
  const textSize = size === "sm" ? "text-[10px]" : size === "lg" ? "text-base" : "text-sm";
  return (
    <div
      className={`${s} ${textSize} rounded-lg flex items-center justify-center text-white font-bold shrink-0`}
      style={{ backgroundColor: color }}
    >
      {abbr.charAt(0)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab type
// ---------------------------------------------------------------------------

type TabId = "myteam" | "scores" | "news" | "standings";

const TABS: { id: TabId; label: string }[] = [
  { id: "myteam", label: "Mitt lag" },
  { id: "scores", label: "Resultat" },
  { id: "news", label: "Nyheter" },
  { id: "standings", label: "Standings" },
];

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function NFLPage() {
  const [activeTab, setActiveTab] = useState<TabId>("myteam");
  const [selectedAbbr, setSelectedAbbr] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) setSelectedAbbr(stored);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (selectedAbbr) {
      localStorage.setItem(LS_KEY, selectedAbbr);
    } else {
      localStorage.removeItem(LS_KEY);
    }
  }, [selectedAbbr, mounted]);

  const selectedTeam = NFL_TEAMS.find((t) => t.abbr === selectedAbbr) ?? null;

  if (!mounted) {
    return (
      <div className="max-w-6xl mx-auto">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Trophy size={28} className="text-accent" />
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">NFL</h1>
            <p className="text-sm text-fg-secondary mt-0.5">Folj ditt favoritlag, resultat, nyheter och tabeller</p>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="glass p-1.5 mb-6 flex gap-1 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-accent/20 text-accent shadow-sm"
                : "text-fg-secondary hover:text-foreground hover:bg-white/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "myteam" && (
        <MyTeamTab
          selectedTeam={selectedTeam}
          onSelectTeam={(abbr) => setSelectedAbbr(abbr)}
          onClearTeam={() => {
            setSelectedAbbr(null);
          }}
        />
      )}
      {activeTab === "scores" && <ScoresTab />}
      {activeTab === "news" && <NewsTab />}
      {activeTab === "standings" && <StandingsTab selectedTeamAbbr={selectedAbbr} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 1: Mitt lag
// ---------------------------------------------------------------------------

function MyTeamTab({
  selectedTeam,
  onSelectTeam,
  onClearTeam,
}: {
  selectedTeam: NFLTeam | null;
  onSelectTeam: (abbr: string) => void;
  onClearTeam: () => void;
}) {
  const [data, setData] = useState<TeamScheduleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<Record<string, { data: TeamScheduleData; ts: number }>>({});

  const loadSchedule = useCallback(
    async (team: NFLTeam, force = false) => {
      const cached = cacheRef.current[team.abbr];
      if (!force && cached && Date.now() - cached.ts < CACHE_DURATION) {
        setData(cached.data);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${team.espnId}/schedule`
        );
        if (!res.ok) throw new Error("API error");
        const json = await res.json();

        let wins = 0,
          losses = 0,
          ties = 0;
        try {
          const record = json.team?.record?.items?.[0];
          if (record) {
            const stats = record.stats as { name: string; value: number }[];
            wins = stats.find((s) => s.name === "wins")?.value ?? 0;
            losses = stats.find((s) => s.name === "losses")?.value ?? 0;
            ties = stats.find((s) => s.name === "ties")?.value ?? 0;
          }
        } catch {
          /* fallback below */
        }

        const now = new Date();
        const games: ScheduleGame[] = [];

        const events = json.events ?? [];
        for (const event of events) {
          const comp = event.competitions?.[0];
          if (!comp) continue;
          const competitors = comp.competitors ?? [];
          const teamEntry = competitors.find((c: { id: string }) => c.id === String(team.espnId));
          const oppEntry = competitors.find((c: { id: string }) => c.id !== String(team.espnId));
          if (!teamEntry || !oppEntry) continue;

          const oppAbbr = oppEntry.team?.abbreviation ?? "???";
          const oppName = oppEntry.team?.shortDisplayName ?? oppAbbr;
          const oppColor = oppEntry.team?.color ? `#${oppEntry.team.color}` : "#666";
          const homeAway: "vs" | "@" = teamEntry.homeAway === "home" ? "vs" : "@";
          const completed = comp.status?.type?.completed ?? false;
          const statusText = comp.status?.type?.shortDetail ?? "";
          const gameDate = new Date(event.date);
          const week = event.week?.number ?? 0;

          let teamScore: number | null = null;
          let oppScore: number | null = null;
          let won: boolean | null = null;

          if (completed || (comp.status?.type?.state === "in")) {
            teamScore = parseInt(teamEntry.score?.value ?? teamEntry.score ?? "0", 10);
            oppScore = parseInt(oppEntry.score?.value ?? oppEntry.score ?? "0", 10);
            if (completed) {
              won = teamScore > oppScore;
            }
          }

          games.push({
            id: event.id ?? `${week}-${oppAbbr}`,
            opponent: oppName,
            opponentAbbr: oppAbbr,
            opponentColor: oppColor,
            teamScore,
            oppScore,
            won,
            date: formatDateShort(event.date),
            rawDate: event.date,
            time: formatTime(event.date),
            homeAway,
            completed,
            week,
            statusText,
          });
        }

        // Fallback record calc
        if (wins === 0 && losses === 0 && ties === 0 && games.length > 0) {
          wins = games.filter((g) => g.won === true).length;
          losses = games.filter((g) => g.won === false).length;
        }

        const result: TeamScheduleData = { wins, losses, ties, games };
        cacheRef.current[team.abbr] = { data: result, ts: Date.now() };
        setData(result);
      } catch {
        setError("Kunde inte hamta schema fran ESPN");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (selectedTeam) loadSchedule(selectedTeam);
  }, [selectedTeam, loadSchedule]);

  // Team picker
  if (!selectedTeam) {
    return (
      <div className="glass p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-foreground mb-1">Valj ditt lag</h2>
        <p className="text-sm text-fg-secondary mb-6">Klicka pa ett lag for att folja deras sasongsschema</p>

        {(["AFC", "NFC"] as const).map((conf) => (
          <div key={conf} className="mb-6">
            <h3 className="text-sm font-bold text-accent mb-3">{conf}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {["East", "North", "South", "West"].map((div) => (
                <div key={div}>
                  <p className="text-xs text-fg-tertiary mb-2 uppercase tracking-wider">{div}</p>
                  <div className="space-y-1.5">
                    {NFL_TEAMS.filter((t) => t.conference === conf && t.division === div).map((t) => (
                      <button
                        key={t.abbr}
                        onClick={() => onSelectTeam(t.abbr)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg btn-ghost text-left transition-all hover:scale-[1.02]"
                      >
                        <img src={nflLogo(t.espnId, 32)} alt={t.name} className="w-6 h-6 object-contain shrink-0" />
                        <div>
                          <span className="text-xs font-medium text-foreground">{t.name}</span>
                          <span className="text-[10px] text-fg-tertiary ml-1.5">{t.abbr}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Team schedule view
  return (
    <div className="space-y-4">
      {/* Team header */}
      <div className="glass p-5 sm:p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <TeamBadge abbr={selectedTeam.abbr} color={selectedTeam.color} size="lg" espnId={selectedTeam.espnId} />
            <div>
              <h2 className="text-xl font-bold text-foreground">{selectedTeam.fullName}</h2>
              <p className="text-sm text-fg-secondary">
                {selectedTeam.conference} {selectedTeam.division}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {data && (
              <div className="text-center px-4 py-2 rounded-xl bg-surface">
                <p className="text-2xl font-bold font-mono text-foreground">
                  {data.wins}-{data.losses}
                  {data.ties > 0 ? `-${data.ties}` : ""}
                </p>
                <p className="text-[10px] text-fg-tertiary uppercase tracking-wider">Sasong</p>
              </div>
            )}
            <button
              onClick={() => selectedTeam && loadSchedule(selectedTeam, true)}
              disabled={loading}
              className="btn-ghost p-2 rounded-lg"
              title="Uppdatera"
            >
              <RefreshCw size={16} className={`text-fg-secondary ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClearTeam}
              className="btn-ghost flex items-center gap-1.5 px-3 py-2 text-xs text-fg-secondary rounded-lg"
            >
              <ArrowLeft size={14} />
              Byt lag
            </button>
          </div>
        </div>
      </div>

      {loading && !data && <Spinner />}
      {error && (
        <div className="glass p-4 text-center text-red-400 text-sm">{error}</div>
      )}

      {data && (
        <div className="glass p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Calendar size={16} className="text-accent" />
            Sasongschema
          </h3>

          {data.games.length === 0 ? (
            <p className="text-sm text-fg-secondary py-4 text-center">
              Inget schema tillgangligt. Sasongen har antagligen inte borjat annu.
            </p>
          ) : (
            <div className="space-y-1.5">
              {data.games.map((game) => {
                const isPast = game.completed;
                const isUpcoming = !game.completed && game.won === null;
                return (
                  <div
                    key={game.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                      isPast ? "bg-surface/30" : "bg-surface/60 border border-glass-border"
                    }`}
                  >
                    {/* Week */}
                    <span className="text-[10px] text-fg-tertiary font-mono w-8 shrink-0 text-center">
                      V{game.week}
                    </span>

                    {/* W/L badge */}
                    <span className="w-6 text-center shrink-0">
                      {game.won === true && (
                        <span className="text-xs font-bold text-emerald-400">W</span>
                      )}
                      {game.won === false && (
                        <span className="text-xs font-bold text-red-400">L</span>
                      )}
                      {game.won === null && isPast && (
                        <span className="text-xs font-bold text-yellow-400">T</span>
                      )}
                      {isUpcoming && (
                        <span className="text-[10px] text-fg-tertiary">-</span>
                      )}
                    </span>

                    {/* Opponent */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <TeamBadge abbr={game.opponentAbbr} color={game.opponentColor} size="sm" />
                      <div className="min-w-0">
                        <span className="text-sm text-foreground font-medium">
                          {game.homeAway} {game.opponent}
                        </span>
                      </div>
                    </div>

                    {/* Score or date/time */}
                    <div className="text-right shrink-0">
                      {game.teamScore !== null ? (
                        <span className="text-sm font-mono font-bold text-foreground">
                          {game.teamScore} - {game.oppScore}
                        </span>
                      ) : (
                        <div className="flex items-center gap-1 text-fg-secondary">
                          <Clock size={12} />
                          <span className="text-xs">{game.time}</span>
                        </div>
                      )}
                      <p className="text-[10px] text-fg-tertiary">{game.date}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2: Resultat (Scores)
// ---------------------------------------------------------------------------

function ScoresTab() {
  const [games, setGames] = useState<ScoreboardGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [seasonType, setSeasonType] = useState<number>(2);

  const fetchScoreboard = useCallback(async (week: number | null, st: number) => {
    setLoading(true);
    setError(null);
    try {
      let url = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";
      if (week !== null) {
        url += `?week=${week}&seasontype=${st}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("API error");
      const json = await res.json();

      // Try to auto-detect current week from response
      if (week === null && json.week?.number) {
        setSelectedWeek(json.week.number);
      }
      if (week === null && json.season?.type) {
        setSeasonType(json.season.type);
      }

      const events = json.events ?? [];
      const parsed: ScoreboardGame[] = events.map((event: Record<string, unknown>) => {
        const comp = (event.competitions as Record<string, unknown>[])?.[0] ?? {};
        const competitors = (comp.competitors as Record<string, unknown>[]) ?? [];
        const home = competitors.find((c) => (c as { homeAway: string }).homeAway === "home") as Record<string, unknown> | undefined;
        const away = competitors.find((c) => (c as { homeAway: string }).homeAway === "away") as Record<string, unknown> | undefined;

        const homeTeamData = (home?.team ?? {}) as Record<string, string>;
        const awayTeamData = (away?.team ?? {}) as Record<string, string>;

        const statusType = ((comp.status as Record<string, unknown>)?.type as Record<string, unknown>) ?? {};
        const state = (statusType.state as string) ?? "pre";
        const detail = (statusType.shortDetail as string) ?? "";

        return {
          id: event.id as string,
          homeTeam: {
            abbr: homeTeamData.abbreviation ?? "???",
            name: homeTeamData.shortDisplayName ?? homeTeamData.abbreviation ?? "???",
            color: homeTeamData.color ? `#${homeTeamData.color}` : "#666",
            score: (home?.score as string) ?? ((home?.score as Record<string, string>)?.value) ?? "0",
          },
          awayTeam: {
            abbr: awayTeamData.abbreviation ?? "???",
            name: awayTeamData.shortDisplayName ?? awayTeamData.abbreviation ?? "???",
            color: awayTeamData.color ? `#${awayTeamData.color}` : "#666",
            score: (away?.score as string) ?? ((away?.score as Record<string, string>)?.value) ?? "0",
          },
          status: state as "pre" | "in" | "post",
          statusDetail: detail,
          date: formatDateShort(event.date as string),
          time: formatTime(event.date as string),
        };
      });

      setGames(parsed);
    } catch {
      setError("Kunde inte hamta resultat");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScoreboard(null, 2);
  }, [fetchScoreboard]);

  const handleWeekClick = (week: number) => {
    setSelectedWeek(week);
    fetchScoreboard(week, seasonType);
  };

  return (
    <div className="space-y-4">
      {/* Week selector */}
      <div className="glass p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Valj vecka</h3>
          <div className="flex gap-1">
            <button
              onClick={() => setSeasonType(1)}
              className={`text-[10px] px-2 py-1 rounded-lg transition-colors ${
                seasonType === 1 ? "bg-accent/20 text-accent" : "text-fg-tertiary hover:text-fg-secondary"
              }`}
            >
              Pre
            </button>
            <button
              onClick={() => setSeasonType(2)}
              className={`text-[10px] px-2 py-1 rounded-lg transition-colors ${
                seasonType === 2 ? "bg-accent/20 text-accent" : "text-fg-tertiary hover:text-fg-secondary"
              }`}
            >
              Reg
            </button>
            <button
              onClick={() => setSeasonType(3)}
              className={`text-[10px] px-2 py-1 rounded-lg transition-colors ${
                seasonType === 3 ? "bg-accent/20 text-accent" : "text-fg-tertiary hover:text-fg-secondary"
              }`}
            >
              Post
            </button>
          </div>
        </div>
        <div className="flex gap-1 flex-wrap">
          {Array.from({ length: 18 }, (_, i) => i + 1).map((w) => (
            <button
              key={w}
              onClick={() => handleWeekClick(w)}
              className={`w-9 h-9 rounded-lg text-xs font-medium transition-all ${
                selectedWeek === w
                  ? "bg-accent text-white shadow-md"
                  : "bg-surface/50 text-fg-secondary hover:bg-surface hover:text-foreground"
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* Games */}
      {loading && <Spinner />}
      {error && <div className="glass p-4 text-center text-red-400 text-sm">{error}</div>}

      {!loading && games.length === 0 && !error && (
        <div className="glass p-8 text-center">
          <p className="text-sm text-fg-secondary">Inga matcher hittades for denna vecka</p>
        </div>
      )}

      {!loading && games.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {games.map((game) => (
            <div key={game.id} className="glass p-4 hover:scale-[1.01] transition-transform">
              {/* Status pill */}
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] text-fg-tertiary">{game.date}</span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    game.status === "in"
                      ? "bg-red-500/20 text-red-400 animate-pulse"
                      : game.status === "post"
                      ? "bg-surface text-fg-tertiary"
                      : "bg-accent/10 text-accent"
                  }`}
                >
                  {game.status === "in" ? "LIVE" : game.statusDetail}
                </span>
              </div>

              {/* Away team */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TeamBadge abbr={game.awayTeam.abbr} color={game.awayTeam.color} size="sm" />
                  <span className="text-sm font-medium text-foreground">{game.awayTeam.name}</span>
                  <span className="text-[10px] text-fg-tertiary">{game.awayTeam.abbr}</span>
                </div>
                <span
                  className={`text-lg font-bold font-mono ${
                    game.status === "post" && Number(game.awayTeam.score) > Number(game.homeTeam.score)
                      ? "text-accent"
                      : "text-foreground"
                  }`}
                >
                  {game.status === "pre" ? "-" : game.awayTeam.score}
                </span>
              </div>

              {/* Home team */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TeamBadge abbr={game.homeTeam.abbr} color={game.homeTeam.color} size="sm" />
                  <span className="text-sm font-medium text-foreground">{game.homeTeam.name}</span>
                  <span className="text-[10px] text-fg-tertiary">{game.homeTeam.abbr}</span>
                </div>
                <span
                  className={`text-lg font-bold font-mono ${
                    game.status === "post" && Number(game.homeTeam.score) > Number(game.awayTeam.score)
                      ? "text-accent"
                      : "text-foreground"
                  }`}
                >
                  {game.status === "pre" ? "-" : game.homeTeam.score}
                </span>
              </div>

              {/* Upcoming game time */}
              {game.status === "pre" && (
                <div className="mt-2 pt-2 border-t border-separator flex items-center gap-1 text-fg-tertiary">
                  <Clock size={12} />
                  <span className="text-xs">{game.time}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 3: Nyheter (News)
// ---------------------------------------------------------------------------

function NewsTab() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch(
          "https://site.api.espn.com/apis/site/v2/sports/football/nfl/news?limit=15"
        );
        if (!res.ok) throw new Error("API error");
        const json = await res.json();

        const items = (json.articles ?? []).slice(0, 15);
        const parsed: NewsArticle[] = items.map((a: Record<string, unknown>) => ({
          id: String((a as { id?: number }).id ?? Math.random()),
          headline: (a.headline as string) ?? "",
          description: (a.description as string) ?? "",
          published: (a.published as string) ?? "",
          imageUrl: ((a.images as { url: string }[])?.[0]?.url) ?? null,
          linkUrl:
            ((a.links as Record<string, unknown>)?.web as Record<string, string>)?.href ??
            ((a.links as Record<string, unknown>)?.api as Record<string, unknown>)?.self as string ??
            "https://www.espn.com/nfl/",
        }));
        setArticles(parsed);
      } catch {
        setError("Kunde inte hamta nyheter");
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, []);

  if (loading) return <Spinner />;
  if (error) return <div className="glass p-4 text-center text-red-400 text-sm">{error}</div>;

  return (
    <div className="space-y-3">
      {articles.map((article) => (
        <a
          key={article.id}
          href={article.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="glass p-4 sm:p-5 flex gap-4 hover:scale-[1.005] transition-transform group cursor-pointer block"
        >
          {article.imageUrl && (
            <div className="shrink-0 w-24 h-24 sm:w-32 sm:h-24 rounded-xl overflow-hidden bg-surface">
              <img
                src={article.imageUrl}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                loading="lazy"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-semibold text-foreground leading-snug mb-1 group-hover:text-accent transition-colors line-clamp-2">
              {article.headline}
            </h3>
            {article.description && (
              <p className="text-xs text-fg-secondary leading-relaxed line-clamp-2 mb-2">
                {article.description}
              </p>
            )}
            <div className="flex items-center gap-2 text-fg-tertiary">
              <span className="text-[10px]">{formatRelativeDate(article.published)}</span>
              <span className="text-[10px]">ESPN</span>
              <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 4: Standings
// ---------------------------------------------------------------------------

function StandingsTab({ selectedTeamAbbr }: { selectedTeamAbbr: string | null }) {
  const [entries, setEntries] = useState<StandingsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStandings() {
      try {
        const res = await fetch(
          "https://site.api.espn.com/apis/site/v2/sports/football/nfl/standings"
        );
        if (!res.ok) throw new Error("API error");
        const json = await res.json();

        const parsed: StandingsEntry[] = [];
        const children = json.children ?? [];

        for (const confGroup of children) {
          const conference = confGroup.abbreviation ?? confGroup.name ?? "???";
          const divisions = confGroup.children ?? [];
          for (const divGroup of divisions) {
            const division = (divGroup.name as string)?.replace(`${conference} `, "") ?? "???";
            const standings = divGroup.standings?.entries ?? [];
            for (const entry of standings) {
              const team = entry.team ?? {};
              const stats = entry.stats ?? [];
              const getStat = (name: string) =>
                stats.find((s: { name: string; value: number }) => s.name === name)?.value ?? 0;

              parsed.push({
                teamAbbr: team.abbreviation ?? "???",
                teamName: team.shortDisplayName ?? team.displayName ?? team.abbreviation ?? "???",
                teamColor: team.color ? `#${team.color}` : "#666",
                espnId: parseInt(team.id ?? "0", 10),
                wins: getStat("wins"),
                losses: getStat("losses"),
                ties: getStat("ties"),
                pct: getStat("winPercent")
                  ? Number(getStat("winPercent")).toFixed(3)
                  : (getStat("wins") / Math.max(1, getStat("wins") + getStat("losses"))).toFixed(3),
                division,
                conference,
              });
            }
          }
        }

        setEntries(parsed);
      } catch {
        setError("Kunde inte hamta tabeller");
      } finally {
        setLoading(false);
      }
    }
    fetchStandings();
  }, []);

  if (loading) return <Spinner />;
  if (error) return <div className="glass p-4 text-center text-red-400 text-sm">{error}</div>;

  const conferences = ["AFC", "NFC"];
  const divisions = ["East", "North", "South", "West"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {conferences.map((conf) => (
        <div key={conf} className="space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Star size={18} className="text-accent" />
            {conf}
          </h2>

          {divisions.map((div) => {
            const divEntries = entries
              .filter((e) => e.conference === conf && e.division === div)
              .sort((a, b) => Number(b.pct) - Number(a.pct));

            if (divEntries.length === 0) return null;

            return (
              <div key={div} className="glass p-4">
                <h3 className="text-xs font-bold text-accent uppercase tracking-wider mb-3">
                  {conf} {div}
                </h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] text-fg-tertiary uppercase tracking-wider">
                      <th className="text-left pb-2 font-medium">Lag</th>
                      <th className="text-center pb-2 font-medium w-8">W</th>
                      <th className="text-center pb-2 font-medium w-8">L</th>
                      <th className="text-center pb-2 font-medium w-8">T</th>
                      <th className="text-right pb-2 font-medium w-14">PCT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {divEntries.map((entry) => {
                      const isSelected = entry.teamAbbr === selectedTeamAbbr;
                      return (
                        <tr
                          key={entry.teamAbbr}
                          className={`border-t border-separator/50 ${
                            isSelected ? "bg-accent/10" : ""
                          }`}
                        >
                          <td className="py-2">
                            <div className="flex items-center gap-2">
                              <TeamBadge abbr={entry.teamAbbr} color={entry.teamColor} size="sm" />
                              <span
                                className={`text-sm font-medium ${
                                  isSelected ? "text-accent" : "text-foreground"
                                }`}
                              >
                                {entry.teamName}
                              </span>
                            </div>
                          </td>
                          <td className="text-center text-foreground font-mono">{entry.wins}</td>
                          <td className="text-center text-foreground font-mono">{entry.losses}</td>
                          <td className="text-center text-fg-tertiary font-mono">{entry.ties}</td>
                          <td className="text-right text-fg-secondary font-mono">{entry.pct}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

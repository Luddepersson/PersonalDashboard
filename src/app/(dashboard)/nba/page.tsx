"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Trophy, RefreshCw, ChevronRight, Newspaper, BarChart3, Calendar, Users } from "lucide-react";

/* ───────── types ───────── */

interface NBATeam {
  abbr: string;
  name: string;
  fullName: string;
  color: string;
  conference: "Western" | "Eastern";
  espnId: number;
}

interface GameInfo {
  opponent: string;
  opponentFull: string;
  teamScore: number;
  oppScore: number;
  won: boolean;
  date: string;
  rawDate: string;
  homeAway: string;
}

interface NextGameInfo {
  opponent: string;
  opponentAbbr: string;
  date: string;
  time: string;
  homeAway: string;
}

interface ScheduleGame {
  opponent: string;
  opponentAbbr: string;
  date: string;
  rawDate: string;
  time: string;
  homeAway: string;
  completed: boolean;
  teamScore?: number;
  oppScore?: number;
  won?: boolean;
}

interface TeamPageData {
  wins: number;
  losses: number;
  confRank: number;
  conference: string;
  recentGames: GameInfo[];
  nextGame: NextGameInfo | null;
  schedule: ScheduleGame[];
}

interface ScoreboardGame {
  id: string;
  name: string;
  date: string;
  status: string;
  statusDetail: string;
  completed: boolean;
  homeTeam: string;
  homeAbbr: string;
  homeScore: string;
  homeLogo: string;
  homeId: string;
  awayTeam: string;
  awayAbbr: string;
  awayScore: string;
  awayLogo: string;
  awayId: string;
}

interface NewsItem {
  headline: string;
  description: string;
  published: string;
  link: string;
  images: string[];
}

interface StandingsEntry {
  teamId: string;
  teamName: string;
  teamAbbr: string;
  wins: number;
  losses: number;
  pct: string;
  streak: string;
  seed: number;
}

interface StandingsData {
  eastern: StandingsEntry[];
  western: StandingsEntry[];
}

/* ───────── constants ───────── */

const NBA_TEAMS: NBATeam[] = [
  { abbr: "ATL", name: "Hawks", fullName: "Atlanta Hawks", color: "#E03A3E", conference: "Eastern", espnId: 1 },
  { abbr: "BOS", name: "Celtics", fullName: "Boston Celtics", color: "#007A33", conference: "Eastern", espnId: 2 },
  { abbr: "BKN", name: "Nets", fullName: "Brooklyn Nets", color: "#000000", conference: "Eastern", espnId: 17 },
  { abbr: "CHA", name: "Hornets", fullName: "Charlotte Hornets", color: "#1D1160", conference: "Eastern", espnId: 30 },
  { abbr: "CHI", name: "Bulls", fullName: "Chicago Bulls", color: "#CE1141", conference: "Eastern", espnId: 4 },
  { abbr: "CLE", name: "Cavaliers", fullName: "Cleveland Cavaliers", color: "#860038", conference: "Eastern", espnId: 5 },
  { abbr: "DAL", name: "Mavericks", fullName: "Dallas Mavericks", color: "#00538C", conference: "Western", espnId: 6 },
  { abbr: "DEN", name: "Nuggets", fullName: "Denver Nuggets", color: "#0E2240", conference: "Western", espnId: 7 },
  { abbr: "DET", name: "Pistons", fullName: "Detroit Pistons", color: "#C8102E", conference: "Eastern", espnId: 8 },
  { abbr: "GSW", name: "Warriors", fullName: "Golden State Warriors", color: "#1D428A", conference: "Western", espnId: 9 },
  { abbr: "HOU", name: "Rockets", fullName: "Houston Rockets", color: "#CE1141", conference: "Western", espnId: 10 },
  { abbr: "IND", name: "Pacers", fullName: "Indiana Pacers", color: "#002D62", conference: "Eastern", espnId: 11 },
  { abbr: "LAC", name: "Clippers", fullName: "LA Clippers", color: "#C8102E", conference: "Western", espnId: 12 },
  { abbr: "LAL", name: "Lakers", fullName: "Los Angeles Lakers", color: "#552583", conference: "Western", espnId: 13 },
  { abbr: "MEM", name: "Grizzlies", fullName: "Memphis Grizzlies", color: "#5D76A9", conference: "Western", espnId: 29 },
  { abbr: "MIA", name: "Heat", fullName: "Miami Heat", color: "#98002E", conference: "Eastern", espnId: 14 },
  { abbr: "MIL", name: "Bucks", fullName: "Milwaukee Bucks", color: "#00471B", conference: "Eastern", espnId: 15 },
  { abbr: "MIN", name: "Timberwolves", fullName: "Minnesota Timberwolves", color: "#0C2340", conference: "Western", espnId: 16 },
  { abbr: "NOP", name: "Pelicans", fullName: "New Orleans Pelicans", color: "#0C2340", conference: "Western", espnId: 3 },
  { abbr: "NYK", name: "Knicks", fullName: "New York Knicks", color: "#006BB6", conference: "Eastern", espnId: 18 },
  { abbr: "OKC", name: "Thunder", fullName: "Oklahoma City Thunder", color: "#007AC1", conference: "Western", espnId: 25 },
  { abbr: "ORL", name: "Magic", fullName: "Orlando Magic", color: "#0077C0", conference: "Eastern", espnId: 19 },
  { abbr: "PHI", name: "76ers", fullName: "Philadelphia 76ers", color: "#006BB6", conference: "Eastern", espnId: 20 },
  { abbr: "PHX", name: "Suns", fullName: "Phoenix Suns", color: "#1D1160", conference: "Western", espnId: 21 },
  { abbr: "POR", name: "Trail Blazers", fullName: "Portland Trail Blazers", color: "#E03A3E", conference: "Western", espnId: 22 },
  { abbr: "SAC", name: "Kings", fullName: "Sacramento Kings", color: "#5A2D81", conference: "Western", espnId: 23 },
  { abbr: "SAS", name: "Spurs", fullName: "San Antonio Spurs", color: "#C4CED4", conference: "Western", espnId: 24 },
  { abbr: "TOR", name: "Raptors", fullName: "Toronto Raptors", color: "#CE1141", conference: "Eastern", espnId: 28 },
  { abbr: "UTA", name: "Jazz", fullName: "Utah Jazz", color: "#002B5C", conference: "Western", espnId: 26 },
  { abbr: "WAS", name: "Wizards", fullName: "Washington Wizards", color: "#002B5C", conference: "Eastern", espnId: 27 },
];

const LS_KEY = "dashboard-nba-team";
const CACHE_DURATION = 5 * 60 * 1000;

type Tab = "team" | "scores" | "news" | "standings";

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

function nbaLogo(espnId: number | string, size = 40) {
  return `https://a.espncdn.com/combiner/i?img=/i/teamlogos/nba/500/${espnId}.png&h=${size}&w=${size}`;
}

/* ───────── API fetchers ───────── */

async function fetchTeamPageData(team: NBATeam): Promise<TeamPageData> {
  const [schedRes, standRes] = await Promise.all([
    fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${team.espnId}/schedule`),
    fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/standings`),
  ]);
  if (!schedRes.ok) throw new Error("ESPN API error");

  const schedJson = await schedRes.json();
  const now = new Date();
  const recentGames: GameInfo[] = [];
  const schedule: ScheduleGame[] = [];
  let nextGame: NextGameInfo | null = null;
  let wins = 0, losses = 0;

  try {
    const record = schedJson.team?.record?.items?.[0];
    if (record) {
      const stats = record.stats;
      wins = stats?.find((s: { name: string; value: number }) => s.name === "wins")?.value ?? 0;
      losses = stats?.find((s: { name: string; value: number }) => s.name === "losses")?.value ?? 0;
    }
  } catch { /* fallback below */ }

  const events = schedJson.events ?? [];
  for (const event of events) {
    const comp = event.competitions?.[0];
    if (!comp) continue;
    const gameDate = new Date(event.date);
    const competitors = comp.competitors ?? [];
    const teamEntry = competitors.find((c: { id: string }) => c.id === String(team.espnId));
    const oppEntry = competitors.find((c: { id: string }) => c.id !== String(team.espnId));
    if (!teamEntry || !oppEntry) continue;

    const oppAbbr = oppEntry.team?.abbreviation ?? "???";
    const oppName = oppEntry.team?.shortDisplayName ?? oppAbbr;
    const homeAway = teamEntry.homeAway === "home" ? "vs" : "@";
    const completed = comp.status?.type?.completed ?? event.status?.type?.completed ?? false;

    if (completed && gameDate <= now) {
      const teamScore = parseInt(teamEntry.score?.value ?? teamEntry.score ?? "0", 10);
      const oppScore = parseInt(oppEntry.score?.value ?? oppEntry.score ?? "0", 10);
      recentGames.push({
        opponent: oppAbbr, opponentFull: oppName, teamScore, oppScore,
        won: teamScore > oppScore, date: formatDate(event.date), rawDate: event.date, homeAway,
      });
      schedule.push({
        opponent: oppName, opponentAbbr: oppAbbr, date: formatDate(event.date),
        rawDate: event.date, time: formatTime(event.date), homeAway, completed: true,
        teamScore, oppScore, won: teamScore > oppScore,
      });
    } else {
      schedule.push({
        opponent: oppName, opponentAbbr: oppAbbr, date: formatDate(event.date),
        rawDate: event.date, time: formatTime(event.date), homeAway, completed: false,
      });
      if (!nextGame && gameDate > now) {
        const sixMonths = 6 * 30 * 24 * 60 * 60 * 1000;
        if (gameDate.getTime() - now.getTime() < sixMonths) {
          nextGame = { opponent: oppName, opponentAbbr: oppAbbr, date: formatDate(event.date), time: formatTime(event.date), homeAway };
        }
      }
    }
  }

  recentGames.reverse();
  if (wins === 0 && losses === 0 && recentGames.length > 0) {
    wins = recentGames.filter((g) => g.won).length;
    losses = recentGames.filter((g) => !g.won).length;
  }

  let confRank = 0;
  try {
    if (standRes.ok) {
      const standJson = await standRes.json();
      for (const conf of (standJson.children ?? [])) {
        for (const entry of (conf.standings?.entries ?? [])) {
          if (entry.team?.id === String(team.espnId)) {
            const rankStat = entry.stats?.find((s: { name: string }) => s.name === "playoffSeed" || s.name === "rank");
            confRank = rankStat?.value ?? 0;
            break;
          }
        }
        if (confRank > 0) break;
      }
    }
  } catch { /* optional */ }

  return { wins, losses, confRank, conference: team.conference, recentGames: recentGames.slice(0, 5), nextGame, schedule };
}

async function fetchScoreboard(): Promise<ScoreboardGame[]> {
  const res = await fetch("https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard");
  if (!res.ok) throw new Error("ESPN API error");
  const json = await res.json();
  const games: ScoreboardGame[] = [];
  for (const event of (json.events ?? [])) {
    const comp = event.competitions?.[0];
    if (!comp) continue;
    const home = comp.competitors?.find((c: { homeAway: string }) => c.homeAway === "home");
    const away = comp.competitors?.find((c: { homeAway: string }) => c.homeAway === "away");
    if (!home || !away) continue;
    games.push({
      id: event.id,
      name: event.name ?? "",
      date: event.date,
      status: comp.status?.type?.name ?? "",
      statusDetail: comp.status?.type?.shortDetail ?? comp.status?.type?.detail ?? "",
      completed: comp.status?.type?.completed ?? false,
      homeTeam: home.team?.shortDisplayName ?? home.team?.abbreviation ?? "???",
      homeAbbr: home.team?.abbreviation ?? "???",
      homeScore: home.score ?? "0",
      homeLogo: home.team?.logo ?? "",
      homeId: home.team?.id ?? "",
      awayTeam: away.team?.shortDisplayName ?? away.team?.abbreviation ?? "???",
      awayAbbr: away.team?.abbreviation ?? "???",
      awayScore: away.score ?? "0",
      awayLogo: away.team?.logo ?? "",
      awayId: away.team?.id ?? "",
    });
  }
  return games;
}

async function fetchNews(): Promise<NewsItem[]> {
  const res = await fetch("https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news");
  if (!res.ok) throw new Error("ESPN API error");
  const json = await res.json();
  return (json.articles ?? []).slice(0, 20).map((a: Record<string, unknown>) => ({
    headline: (a.headline as string) ?? "",
    description: (a.description as string) ?? "",
    published: (a.published as string) ?? "",
    link: ((a.links as Record<string, unknown>)?.web as Record<string, unknown>)?.href as string ?? "",
    images: ((a.images as Array<Record<string, unknown>>) ?? []).map((img) => (img.url as string) ?? "").filter(Boolean),
  }));
}

async function fetchStandings(): Promise<StandingsData> {
  const res = await fetch("https://site.api.espn.com/apis/site/v2/sports/basketball/nba/standings");
  if (!res.ok) throw new Error("ESPN API error");
  const json = await res.json();
  const result: StandingsData = { eastern: [], western: [] };

  for (const conf of (json.children ?? [])) {
    const confName: string = conf.name ?? conf.abbreviation ?? "";
    const isEast = confName.toLowerCase().includes("east");
    const entries: StandingsEntry[] = [];

    for (const entry of (conf.standings?.entries ?? [])) {
      const stats = entry.stats ?? [];
      const getStat = (name: string) => stats.find((s: { name: string }) => s.name === name);
      entries.push({
        teamId: entry.team?.id ?? "",
        teamName: entry.team?.shortDisplayName ?? entry.team?.displayName ?? "???",
        teamAbbr: entry.team?.abbreviation ?? "???",
        wins: getStat("wins")?.value ?? 0,
        losses: getStat("losses")?.value ?? 0,
        pct: (getStat("winPercent")?.displayValue ?? getStat("winPct")?.displayValue ?? ".000"),
        streak: getStat("streak")?.displayValue ?? "-",
        seed: getStat("playoffSeed")?.value ?? 0,
      });
    }

    entries.sort((a, b) => a.seed - b.seed || parseFloat(b.pct) - parseFloat(a.pct));
    if (isEast) result.eastern = entries;
    else result.western = entries;
  }
  return result;
}

/* ───────── component ───────── */

export default function NBAPage() {
  const [activeTab, setActiveTab] = useState<Tab>("team");
  const [selectedAbbr, setSelectedAbbr] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Team tab
  const [teamData, setTeamData] = useState<TeamPageData | null>(null);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);

  // Scores tab
  const [scores, setScores] = useState<ScoreboardGame[]>([]);
  const [scoresLoading, setScoresLoading] = useState(false);
  const [scoresError, setScoresError] = useState<string | null>(null);

  // News tab
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);

  // Standings tab
  const [standings, setStandings] = useState<StandingsData | null>(null);
  const [standingsLoading, setStandingsLoading] = useState(false);
  const [standingsError, setStandingsError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const cacheRef = useRef<Record<string, { data: unknown; ts: number }>>({});

  useEffect(() => {
    mountedRef.current = true;
    const stored = localStorage.getItem(LS_KEY);
    if (stored) setSelectedAbbr(stored);
    setMounted(true);
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (selectedAbbr) localStorage.setItem(LS_KEY, selectedAbbr);
    else localStorage.removeItem(LS_KEY);
  }, [selectedAbbr, mounted]);

  const team = NBA_TEAMS.find((t) => t.abbr === selectedAbbr) ?? null;

  /* ── loaders ── */

  const loadTeamData = useCallback(async (force = false) => {
    if (!team) return;
    const key = `team-${team.abbr}`;
    const cached = cacheRef.current[key];
    if (!force && cached && Date.now() - cached.ts < CACHE_DURATION) {
      setTeamData(cached.data as TeamPageData);
      return;
    }
    setTeamLoading(true); setTeamError(null);
    try {
      const d = await fetchTeamPageData(team);
      if (!mountedRef.current) return;
      cacheRef.current[key] = { data: d, ts: Date.now() };
      setTeamData(d);
    } catch { if (mountedRef.current) setTeamError("Kunde inte hamta lagdata"); }
    finally { if (mountedRef.current) setTeamLoading(false); }
  }, [team]);

  const loadScores = useCallback(async (force = false) => {
    const key = "scores";
    const cached = cacheRef.current[key];
    if (!force && cached && Date.now() - cached.ts < CACHE_DURATION) {
      setScores(cached.data as ScoreboardGame[]);
      return;
    }
    setScoresLoading(true); setScoresError(null);
    try {
      const d = await fetchScoreboard();
      if (!mountedRef.current) return;
      cacheRef.current[key] = { data: d, ts: Date.now() };
      setScores(d);
    } catch { if (mountedRef.current) setScoresError("Kunde inte hamta resultat"); }
    finally { if (mountedRef.current) setScoresLoading(false); }
  }, []);

  const loadNews = useCallback(async (force = false) => {
    const key = "news";
    const cached = cacheRef.current[key];
    if (!force && cached && Date.now() - cached.ts < CACHE_DURATION) {
      setNews(cached.data as NewsItem[]);
      return;
    }
    setNewsLoading(true); setNewsError(null);
    try {
      const d = await fetchNews();
      if (!mountedRef.current) return;
      cacheRef.current[key] = { data: d, ts: Date.now() };
      setNews(d);
    } catch { if (mountedRef.current) setNewsError("Kunde inte hamta nyheter"); }
    finally { if (mountedRef.current) setNewsLoading(false); }
  }, []);

  const loadStandings = useCallback(async (force = false) => {
    const key = "standings";
    const cached = cacheRef.current[key];
    if (!force && cached && Date.now() - cached.ts < CACHE_DURATION) {
      setStandings(cached.data as StandingsData);
      return;
    }
    setStandingsLoading(true); setStandingsError(null);
    try {
      const d = await fetchStandings();
      if (!mountedRef.current) return;
      cacheRef.current[key] = { data: d, ts: Date.now() };
      setStandings(d);
    } catch { if (mountedRef.current) setStandingsError("Kunde inte hamta stallningar"); }
    finally { if (mountedRef.current) setStandingsLoading(false); }
  }, []);

  // Load data on tab change
  useEffect(() => {
    if (!mounted) return;
    if (activeTab === "team" && team) loadTeamData();
    if (activeTab === "scores") loadScores();
    if (activeTab === "news") loadNews();
    if (activeTab === "standings") loadStandings();
  }, [activeTab, mounted, team, loadTeamData, loadScores, loadNews, loadStandings]);

  useEffect(() => {
    if (team && mounted && activeTab === "team") loadTeamData();
  }, [team, mounted, activeTab, loadTeamData]);

  /* ── tabs config ── */

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "team", label: "Mitt lag", icon: <Users size={14} /> },
    { id: "scores", label: "Resultat", icon: <BarChart3 size={14} /> },
    { id: "news", label: "Nyheter", icon: <Newspaper size={14} /> },
    { id: "standings", label: "Standings", icon: <Trophy size={14} /> },
  ];

  if (!mounted) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
      </div>
    );
  }

  /* ───── team picker ───── */

  const renderTeamPicker = () => (
    <div className="glass p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4">Valj ditt NBA-lag</h3>
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2">
        {NBA_TEAMS.map((t) => (
          <button
            key={t.abbr}
            onClick={() => setSelectedAbbr(t.abbr)}
            className="btn-ghost text-xs font-bold py-2.5 px-2 rounded-lg text-center hover:scale-105 transition-transform flex flex-col items-center gap-1.5"
          >
            <img src={nbaLogo(t.espnId, 40)} alt={t.name} className="w-8 h-8 object-contain" />
            <span className="text-foreground">{t.abbr}</span>
            <span className="block text-[10px] text-fg-tertiary font-normal">{t.name}</span>
          </button>
        ))}
      </div>
    </div>
  );

  /* ───── Tab: Mitt lag ───── */

  const renderTeamTab = () => {
    if (!team) return renderTeamPicker();

    return (
      <div className="space-y-4">
        {/* Team header */}
        <div className="glass p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={nbaLogo(team.espnId, 80)} alt={team.name} className="w-12 h-12 object-contain" />
              <div>
                <h2 className="text-lg font-bold text-foreground">{team.fullName}</h2>
                <p className="text-xs text-fg-secondary">{team.conference} Conference</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {teamData && (
                <div className="text-right">
                  <span className="text-xl font-mono font-bold text-foreground">{teamData.wins}-{teamData.losses}</span>
                  {teamData.confRank > 0 && (
                    <p className="text-[11px] text-fg-tertiary">#{teamData.confRank} {team.conference}</p>
                  )}
                </div>
              )}
              <button onClick={() => loadTeamData(true)} disabled={teamLoading} className="btn-ghost p-2 rounded-lg" title="Uppdatera">
                <RefreshCw size={14} className={`text-fg-tertiary ${teamLoading ? "animate-spin" : ""}`} />
              </button>
              <button onClick={() => { setSelectedAbbr(null); setTeamData(null); }} className="btn-ghost text-xs text-fg-tertiary px-3 py-1.5">
                Byt lag
              </button>
            </div>
          </div>
        </div>

        {teamError && <div className="glass p-4 text-sm text-red-400 text-center">{teamError}</div>}

        {teamLoading && !teamData && (
          <div className="glass p-12 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
          </div>
        )}

        {teamData && (
          <>
            {/* Next game + recent */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass p-4">
                <h3 className="text-xs font-semibold text-fg-tertiary uppercase tracking-wider mb-3">Nasta match</h3>
                {teamData.nextGame ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-foreground font-medium">{teamData.nextGame.homeAway} {teamData.nextGame.opponent}</span>
                    </div>
                    <div className="flex items-center gap-1 text-fg-secondary">
                      <span className="text-xs">{teamData.nextGame.date} &bull; {teamData.nextGame.time}</span>
                      <ChevronRight size={12} />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-fg-secondary">Off-season - sasongen borjar i oktober</p>
                )}
              </div>
              <div className="glass p-4">
                <h3 className="text-xs font-semibold text-fg-tertiary uppercase tracking-wider mb-3">Senaste resultat</h3>
                {teamData.recentGames.length === 0 ? (
                  <p className="text-sm text-fg-secondary">Inga matcher spelade</p>
                ) : (
                  <div className="space-y-1.5">
                    {teamData.recentGames.slice(0, 5).map((g, i) => (
                      <div key={i} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold w-5 text-center ${g.won ? "text-emerald-400" : "text-red-400"}`}>{g.won ? "W" : "L"}</span>
                          {(() => { const t = NBA_TEAMS.find(x => x.abbr === g.opponent); return t ? <img src={nbaLogo(t.espnId, 24)} alt="" className="w-4 h-4 object-contain" /> : null; })()}
                          <span className="text-xs text-foreground">{g.homeAway} {g.opponent}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-fg-secondary">{g.teamScore}-{g.oppScore}</span>
                          <span className="text-[10px] text-fg-tertiary">{g.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Full schedule */}
            <div className="glass p-5">
              <h3 className="text-xs font-semibold text-fg-tertiary uppercase tracking-wider mb-4">Spelschema</h3>
              <div className="max-h-[500px] overflow-y-auto pr-1 space-y-1">
                {teamData.schedule.map((g, i) => (
                  <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg ${g.completed ? "bg-surface/30" : "bg-surface/60"}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[11px] text-fg-tertiary w-20 shrink-0">{g.date}</span>
                      <span className="text-xs text-fg-secondary w-4">{g.homeAway}</span>
                      <span className="text-xs text-foreground font-medium truncate">{g.opponent}</span>
                    </div>
                    <div className="shrink-0">
                      {g.completed ? (
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold ${g.won ? "text-emerald-400" : "text-red-400"}`}>{g.won ? "W" : "L"}</span>
                          <span className="text-xs font-mono text-fg-secondary">{g.teamScore}-{g.oppScore}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-fg-tertiary">{g.time}</span>
                      )}
                    </div>
                  </div>
                ))}
                {teamData.schedule.length === 0 && <p className="text-sm text-fg-secondary text-center py-4">Inget schema tillgangligt</p>}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  /* ───── Tab: Resultat ───── */

  const renderScoresTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Dagens matcher</h3>
        <button onClick={() => loadScores(true)} disabled={scoresLoading} className="btn-ghost p-2 rounded-lg">
          <RefreshCw size={14} className={`text-fg-tertiary ${scoresLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {scoresError && <div className="glass p-4 text-sm text-red-400 text-center">{scoresError}</div>}

      {scoresLoading && scores.length === 0 && (
        <div className="glass p-12 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
        </div>
      )}

      {!scoresLoading && scores.length === 0 && !scoresError && (
        <div className="glass p-8 text-center">
          <p className="text-sm text-fg-secondary">Inga matcher idag</p>
          <p className="text-xs text-fg-tertiary mt-1">Kolla tillbaka pa en speldag</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {scores.map((game) => {
          const isUserTeam = (id: string) => team && String(team.espnId) === id;
          return (
            <div key={game.id} className="glass p-4">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] uppercase tracking-wider font-semibold ${game.completed ? "text-fg-tertiary" : game.status === "STATUS_IN_PROGRESS" ? "text-emerald-400" : "text-accent"}`}>
                  {game.statusDetail}
                </span>
              </div>
              {/* Away team */}
              <div className={`flex items-center justify-between py-1.5 ${isUserTeam(game.awayId) ? "bg-accent/10 -mx-2 px-2 rounded" : ""}`}>
                <div className="flex items-center gap-2">
                  {game.awayLogo && <img src={game.awayLogo} alt="" className="w-5 h-5 object-contain" />}
                  <span className={`text-sm ${isUserTeam(game.awayId) ? "font-bold text-accent" : "text-foreground"}`}>{game.awayTeam}</span>
                  <span className="text-[10px] text-fg-tertiary">{game.awayAbbr}</span>
                </div>
                <span className="text-sm font-mono font-bold text-foreground">{game.awayScore}</span>
              </div>
              {/* Home team */}
              <div className={`flex items-center justify-between py-1.5 ${isUserTeam(game.homeId) ? "bg-accent/10 -mx-2 px-2 rounded" : ""}`}>
                <div className="flex items-center gap-2">
                  {game.homeLogo && <img src={game.homeLogo} alt="" className="w-5 h-5 object-contain" />}
                  <span className={`text-sm ${isUserTeam(game.homeId) ? "font-bold text-accent" : "text-foreground"}`}>{game.homeTeam}</span>
                  <span className="text-[10px] text-fg-tertiary">{game.homeAbbr}</span>
                </div>
                <span className="text-sm font-mono font-bold text-foreground">{game.homeScore}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ───── Tab: Nyheter ───── */

  const renderNewsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">NBA-nyheter</h3>
        <button onClick={() => loadNews(true)} disabled={newsLoading} className="btn-ghost p-2 rounded-lg">
          <RefreshCw size={14} className={`text-fg-tertiary ${newsLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {newsError && <div className="glass p-4 text-sm text-red-400 text-center">{newsError}</div>}

      {newsLoading && news.length === 0 && (
        <div className="glass p-12 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
        </div>
      )}

      <div className="space-y-3">
        {news.map((item, i) => (
          <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" className="glass p-4 block hover:bg-surface/60 transition-colors group">
            <div className="flex gap-4">
              {item.images[0] && (
                <img src={item.images[0]} alt="" className="w-20 h-14 object-cover rounded-lg shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-2">{item.headline}</h4>
                {item.description && <p className="text-xs text-fg-secondary mt-1 line-clamp-2">{item.description}</p>}
                <p className="text-[10px] text-fg-tertiary mt-1.5">{formatDate(item.published)}</p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );

  /* ───── Tab: Standings ───── */

  const renderStandingsTable = (title: string, entries: StandingsEntry[]) => (
    <div className="glass p-4">
      <h4 className="text-xs font-semibold text-fg-tertiary uppercase tracking-wider mb-3">{title}</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-fg-tertiary border-b border-white/5">
              <th className="text-left py-2 pr-2 w-6">#</th>
              <th className="text-left py-2">Lag</th>
              <th className="text-center py-2 px-2">W</th>
              <th className="text-center py-2 px-2">L</th>
              <th className="text-center py-2 px-2">PCT</th>
              <th className="text-center py-2 px-2">Streak</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => {
              const isMyTeam = team && String(team.espnId) === e.teamId;
              return (
                <tr key={e.teamId} className={`border-b border-white/5 ${isMyTeam ? "bg-accent/10" : ""} ${i < 6 ? "" : i < 10 ? "" : "opacity-70"}`}>
                  <td className="py-1.5 pr-2 text-fg-tertiary">{e.seed || i + 1}</td>
                  <td className="py-1.5">
                    <div className="flex items-center gap-2">
                      {(() => { const t = NBA_TEAMS.find(x => x.abbr === e.teamAbbr); return t ? <img src={nbaLogo(t.espnId, 24)} alt={e.teamName} className="w-4 h-4 object-contain" /> : null; })()}
                      <span className={`font-medium ${isMyTeam ? "text-accent font-bold" : "text-foreground"}`}>{e.teamName}</span>
                    </div>
                  </td>
                  <td className="py-1.5 px-2 text-center text-fg-secondary">{e.wins}</td>
                  <td className="py-1.5 px-2 text-center text-fg-secondary">{e.losses}</td>
                  <td className="py-1.5 px-2 text-center font-mono text-fg-secondary">{e.pct}</td>
                  <td className="py-1.5 px-2 text-center text-fg-tertiary">{e.streak}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderStandingsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">NBA Standings</h3>
        <button onClick={() => loadStandings(true)} disabled={standingsLoading} className="btn-ghost p-2 rounded-lg">
          <RefreshCw size={14} className={`text-fg-tertiary ${standingsLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {standingsError && <div className="glass p-4 text-sm text-red-400 text-center">{standingsError}</div>}

      {standingsLoading && !standings && (
        <div className="glass p-12 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
        </div>
      )}

      {standings && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {renderStandingsTable("Eastern Conference", standings.eastern)}
          {renderStandingsTable("Western Conference", standings.western)}
        </div>
      )}
    </div>
  );

  /* ───── main render ───── */

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">NBA</h1>
        <p className="text-sm text-fg-secondary mt-1">Folj ditt favoritlag och hela NBA-sasongen</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-surface/30 rounded-xl p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab.id
                ? "bg-accent text-white shadow-sm"
                : "text-fg-secondary hover:text-foreground hover:bg-surface/50"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "team" && renderTeamTab()}
      {activeTab === "scores" && renderScoresTab()}
      {activeTab === "news" && renderNewsTab()}
      {activeTab === "standings" && renderStandingsTab()}
    </div>
  );
}

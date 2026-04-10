"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Trophy, RefreshCw, Search, X, ExternalLink, TrendingUp, TrendingDown } from "lucide-react";

interface CFBTeam { id: string; displayName: string; nickname?: string; abbreviation: string; color?: string; logo?: string; }
interface Game { id: string; week: number; date: string; opponent: string; opponentLogo?: string; opponentAbbr: string; homeAway: "vs" | "@"; status: "completed" | "scheduled"; teamScore?: number; oppScore?: number; won?: boolean; time?: string; }
interface Standing { rank: number; team: { id: string; name: string; logo?: string; record: string; }; points?: number; firstPlaceVotes?: number; trend?: number; }
interface NewsArticle { headline: string; description: string; published: string; image?: string; link: string; }

type Tab = "team" | "scores" | "news" | "rankings";

const LS_TEAM = "dashboard-cfb-team";
const CACHE = 5 * 60 * 1000;

function logoUrl(id: string, size = 80) {
  return `https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/${id}.png&h=${size}&w=${size}`;
}

function relTime(dateStr: string) {
  const d = new Date(dateStr);
  const diffMs = Date.now() - d.getTime();
  const h = Math.floor(diffMs / 3600000);
  if (h < 1) return "Nyss";
  if (h < 24) return `${h}h sedan`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d sedan`;
  return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" });
}

function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
}

export default function CFBPage() {
  const [tab, setTab] = useState<Tab>("team");
  const [mounted, setMounted] = useState(false);
  const [teams, setTeams] = useState<CFBTeam[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamSearch, setTeamSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [schedule, setSchedule] = useState<Game[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [record, setRecord] = useState<string>("");
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [rankings, setRankings] = useState<Standing[]>([]);
  const [rankingsLoading, setRankingsLoading] = useState(false);
  const [scoreboard, setScoreboard] = useState<Record<string, unknown>[]>([]);
  const [scoreboardLoading, setScoreboardLoading] = useState(false);
  const cache = useRef<Record<string, { data: unknown; ts: number }>>({});

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(LS_TEAM);
    if (stored) setSelectedId(stored);

    setTeamsLoading(true);
    fetch("https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams?limit=300")
      .then((r) => r.json())
      .then((data) => {
        const sports = data?.sports?.[0]?.leagues?.[0]?.teams || [];
        const parsed: CFBTeam[] = sports.map((t: Record<string, unknown>) => {
          const team = t.team as Record<string, unknown>;
          const logos = (team.logos as Record<string, unknown>[]) || [];
          return {
            id: team.id as string,
            displayName: team.displayName as string,
            nickname: team.nickname as string,
            abbreviation: (team.abbreviation as string) || "",
            color: team.color as string,
            logo: ((logos[0]?.href as string) || logoUrl(team.id as string)),
          };
        });
        setTeams(parsed.sort((a, b) => a.displayName.localeCompare(b.displayName)));
      })
      .catch(() => {})
      .finally(() => setTeamsLoading(false));
  }, []);

  const selectedTeam = teams.find((t) => t.id === selectedId);

  const loadSchedule = useCallback(async (force = false) => {
    if (!selectedId) return;
    const key = `sched-${selectedId}`;
    if (!force && cache.current[key] && Date.now() - cache.current[key].ts < CACHE) {
      const c = cache.current[key].data as { schedule: Game[]; record: string };
      setSchedule(c.schedule); setRecord(c.record); return;
    }
    setScheduleLoading(true);
    try {
      const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/${selectedId}/schedule`);
      const data = await res.json();
      const events = data?.events || [];
      const recItem = data?.team?.recordSummary || data?.team?.record?.items?.[0]?.summary || "";

      const games: Game[] = events.map((e: Record<string, unknown>) => {
        const comp = (e.competitions as Record<string, unknown>[])?.[0];
        if (!comp) return null;
        const competitors = (comp.competitors as Record<string, unknown>[]) || [];
        const us = competitors.find((c) => (c.id as string) === selectedId);
        const them = competitors.find((c) => (c.id as string) !== selectedId);
        if (!us || !them) return null;
        const themTeam = them.team as Record<string, unknown>;
        const status = (comp.status as Record<string, unknown>)?.type as Record<string, unknown>;
        const completed = status?.completed as boolean;
        const usScore = parseInt((us.score as { value?: number })?.value?.toString() || (us.score as string) || "0", 10);
        const themScore = parseInt((them.score as { value?: number })?.value?.toString() || (them.score as string) || "0", 10);

        return {
          id: e.id as string,
          week: ((e.week as Record<string, unknown>)?.number as number) || 0,
          date: e.date as string,
          opponent: (themTeam.shortDisplayName as string) || (themTeam.displayName as string),
          opponentLogo: ((themTeam.logos as Record<string, unknown>[])?.[0]?.href as string) || logoUrl(themTeam.id as string, 60),
          opponentAbbr: (themTeam.abbreviation as string) || "",
          homeAway: us.homeAway === "home" ? "vs" : "@",
          status: completed ? "completed" : "scheduled",
          teamScore: completed ? usScore : undefined,
          oppScore: completed ? themScore : undefined,
          won: completed ? usScore > themScore : undefined,
          time: !completed ? fmtTime(e.date as string) : undefined,
        } as Game;
      }).filter(Boolean);

      cache.current[key] = { data: { schedule: games, record: recItem }, ts: Date.now() };
      setSchedule(games);
      setRecord(recItem);
    } catch {} finally { setScheduleLoading(false); }
  }, [selectedId]);

  useEffect(() => { if (selectedId && tab === "team") loadSchedule(); }, [selectedId, tab, loadSchedule]);

  useEffect(() => {
    if (tab !== "news") return;
    setNewsLoading(true);
    fetch("https://site.api.espn.com/apis/site/v2/sports/football/college-football/news")
      .then((r) => r.json())
      .then((data) => {
        const articles = (data?.articles || []).slice(0, 20).map((a: Record<string, unknown>) => ({
          headline: a.headline as string,
          description: a.description as string,
          published: a.published as string,
          image: ((a.images as Record<string, unknown>[])?.[0]?.url as string) || undefined,
          link: ((a.links as Record<string, unknown>)?.web as Record<string, string>)?.href || "https://www.espn.com/college-football/",
        }));
        setNews(articles);
      })
      .catch(() => {})
      .finally(() => setNewsLoading(false));
  }, [tab]);

  useEffect(() => {
    if (tab !== "rankings") return;
    setRankingsLoading(true);
    fetch("https://site.api.espn.com/apis/site/v2/sports/football/college-football/rankings")
      .then((r) => r.json())
      .then((data) => {
        const ap = (data?.rankings || []).find((r: Record<string, unknown>) => (r.shortName as string)?.includes("AP")) || data?.rankings?.[0];
        const items = (ap?.ranks || []).map((r: Record<string, unknown>) => ({
          rank: r.current as number,
          team: { id: ((r.team as Record<string, unknown>)?.id as string), name: ((r.team as Record<string, unknown>)?.nickname as string) || ((r.team as Record<string, unknown>)?.name as string), logo: logoUrl(((r.team as Record<string, unknown>)?.id as string), 60), record: (r.recordSummary as string) || "" },
          points: r.points as number,
          firstPlaceVotes: r.firstPlaceVotes as number,
          trend: (r.trend as number) || 0,
        }));
        setRankings(items);
      })
      .catch(() => {})
      .finally(() => setRankingsLoading(false));
  }, [tab]);

  useEffect(() => {
    if (tab !== "scores") return;
    setScoreboardLoading(true);
    fetch("https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard")
      .then((r) => r.json())
      .then((data) => setScoreboard(data?.events || []))
      .catch(() => {})
      .finally(() => setScoreboardLoading(false));
  }, [tab]);

  function selectTeam(id: string) {
    setSelectedId(id);
    localStorage.setItem(LS_TEAM, id);
    setShowPicker(false);
    setTeamSearch("");
  }

  if (!mounted) return null;

  const filteredTeams = teamSearch ? teams.filter((t) => t.displayName.toLowerCase().includes(teamSearch.toLowerCase()) || t.abbreviation.toLowerCase().includes(teamSearch.toLowerCase())) : teams;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-1.5">
          <Trophy size={24} className="text-accent" />
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tighter">College Football</h1>
        </div>
        <p className="text-sm text-fg-secondary">NCAA-resultat, lag, rankings och nyheter</p>
      </div>

      <div className="glass !p-1 mb-6 inline-flex gap-1">
        {[
          { id: "team" as Tab, label: "Mitt lag" },
          { id: "scores" as Tab, label: "Resultat" },
          { id: "news" as Tab, label: "Nyheter" },
          { id: "rankings" as Tab, label: "Rankings" },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.id ? "bg-accent text-white shadow-sm" : "text-fg-secondary hover:text-foreground hover:bg-separator/50"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "team" && (
        <div className="space-y-4">
          {!selectedTeam || showPicker ? (
            <div className="glass">
              <div className="flex items-center gap-3 mb-4">
                <Search size={18} className="text-fg-tertiary" />
                <input type="text" value={teamSearch} onChange={(e) => setTeamSearch(e.target.value)}
                  placeholder="Sök bland alla NCAA-lag..."
                  className="flex-1 bg-transparent text-foreground placeholder-fg-tertiary focus:outline-none text-base" autoFocus />
                {showPicker && selectedTeam && (
                  <button onClick={() => setShowPicker(false)} className="btn-ghost !p-2"><X size={16} /></button>
                )}
              </div>

              {teamsLoading ? (
                <div className="flex items-center justify-center py-12"><div className="h-8 w-8 rounded-full border-2 border-accent/30 border-t-accent animate-spin" /></div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-[60vh] overflow-y-auto -mr-2 pr-2">
                  {filteredTeams.map((t) => (
                    <button key={t.id} onClick={() => selectTeam(t.id)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface/30 hover:bg-accent/10 transition-all text-left"
                      style={{ borderLeft: t.color ? `3px solid #${t.color}` : "3px solid var(--accent)" }}>
                      <img src={logoUrl(t.id, 40)} alt={t.displayName} className="w-8 h-8 object-contain shrink-0" loading="lazy" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground truncate">{t.nickname || t.displayName.split(" ").slice(-1)[0]}</p>
                        <p className="text-[10px] text-fg-tertiary truncate">{t.displayName.replace(t.nickname || "", "").trim() || t.abbreviation}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <p className="text-xs text-fg-tertiary mt-3">{filteredTeams.length} lag</p>
            </div>
          ) : (
            <>
              <div className="glass">
                <div className="flex items-center gap-4">
                  <img src={logoUrl(selectedTeam.id, 120)} alt={selectedTeam.displayName} className="w-20 h-20 object-contain" />
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold text-foreground tracking-tight truncate">{selectedTeam.displayName}</h2>
                    {record && <p className="text-sm text-fg-secondary mt-1">Säsong: <span className="font-mono font-semibold text-foreground">{record}</span></p>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => setShowPicker(true)} className="btn-ghost text-xs">Byt lag</button>
                    <button onClick={() => loadSchedule(true)} className="btn-ghost !p-2"><RefreshCw size={14} className={scheduleLoading ? "animate-spin" : ""} /></button>
                  </div>
                </div>
              </div>

              <div className="glass">
                <h3 className="text-base font-semibold text-foreground mb-4">Säsong</h3>
                {scheduleLoading ? (
                  <div className="flex items-center justify-center py-12"><div className="h-6 w-6 rounded-full border-2 border-accent/30 border-t-accent animate-spin" /></div>
                ) : schedule.length === 0 ? (
                  <p className="text-sm text-fg-tertiary text-center py-8">Inga matcher att visa</p>
                ) : (
                  <div className="space-y-2">
                    {schedule.map((g) => (
                      <div key={g.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface/30 hover:bg-surface/50 transition-colors">
                        <div className="text-[10px] text-fg-tertiary font-mono w-10 shrink-0">V{g.week || "?"}</div>
                        {g.status === "completed" ? (
                          <div className={`text-[10px] font-bold w-6 text-center rounded ${g.won ? "text-green-400" : "text-red-400"}`}>{g.won ? "V" : "F"}</div>
                        ) : (
                          <div className="text-[10px] text-fg-tertiary font-mono w-6 text-center">{g.time || "—"}</div>
                        )}
                        <span className="text-xs text-fg-tertiary">{g.homeAway}</span>
                        <img src={g.opponentLogo} alt={g.opponent} className="w-6 h-6 object-contain shrink-0" loading="lazy" />
                        <span className="text-sm text-foreground flex-1 truncate">{g.opponent}</span>
                        {g.status === "completed" && (
                          <span className="text-sm font-mono font-semibold text-foreground">{g.teamScore}–{g.oppScore}</span>
                        )}
                        <span className="text-[10px] text-fg-tertiary shrink-0">{fmtDate(g.date).split(",")[1]?.trim() || fmtDate(g.date)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {tab === "scores" && (
        <div className="glass">
          <h3 className="text-base font-semibold text-foreground mb-4">Aktuella matcher</h3>
          {scoreboardLoading ? (
            <div className="flex items-center justify-center py-12"><div className="h-6 w-6 rounded-full border-2 border-accent/30 border-t-accent animate-spin" /></div>
          ) : scoreboard.length === 0 ? (
            <p className="text-sm text-fg-tertiary text-center py-8">Inga matcher just nu</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {scoreboard.map((event) => {
                const comp = (event.competitions as Record<string, unknown>[])?.[0];
                if (!comp) return null;
                const competitors = (comp.competitors as Record<string, unknown>[]) || [];
                const home = competitors.find((c) => c.homeAway === "home");
                const away = competitors.find((c) => c.homeAway === "away");
                if (!home || !away) return null;
                const status = ((comp.status as Record<string, unknown>)?.type as Record<string, unknown>);
                const completed = status?.completed as boolean;
                const inProgress = status?.state === "in";
                const detail = status?.shortDetail as string;

                return (
                  <div key={event.id as string} className="p-3 rounded-xl bg-surface/30 border border-separator/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-fg-tertiary uppercase tracking-wider">{detail || ""}</span>
                      {inProgress && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 font-bold animate-pulse">LIVE</span>}
                    </div>
                    {[away, home].map((c) => {
                      const team = c.team as Record<string, unknown>;
                      const score = parseInt((c.score as string) || "0", 10);
                      return (
                        <div key={c.id as string} className="flex items-center gap-2 py-1">
                          <img src={logoUrl(team.id as string, 40)} alt={team.displayName as string} className="w-6 h-6 object-contain" loading="lazy" />
                          <span className="text-sm text-foreground flex-1 truncate">{team.shortDisplayName as string || team.displayName as string}</span>
                          <span className="text-base font-mono font-semibold text-foreground">{completed || inProgress ? score : "—"}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "news" && (
        <div className="space-y-3">
          {newsLoading ? (
            <div className="flex items-center justify-center py-12"><div className="h-6 w-6 rounded-full border-2 border-accent/30 border-t-accent animate-spin" /></div>
          ) : (
            news.map((a, i) => (
              <a key={i} href={a.link} target="_blank" rel="noopener noreferrer" className="glass !p-4 flex gap-4 hover:scale-[1.01] transition-transform">
                {a.image && <img src={a.image} alt="" className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-xl shrink-0" loading="lazy" />}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-foreground tracking-tight mb-1">{a.headline}</h3>
                  <p className="text-xs text-fg-secondary line-clamp-2 mb-2">{a.description}</p>
                  <div className="flex items-center gap-2 text-[10px] text-fg-tertiary">
                    <span>{relTime(a.published)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">ESPN <ExternalLink size={9} /></span>
                  </div>
                </div>
              </a>
            ))
          )}
        </div>
      )}

      {tab === "rankings" && (
        <div className="glass">
          <h3 className="text-base font-semibold text-foreground mb-4">AP Top 25</h3>
          {rankingsLoading ? (
            <div className="flex items-center justify-center py-12"><div className="h-6 w-6 rounded-full border-2 border-accent/30 border-t-accent animate-spin" /></div>
          ) : (
            <div className="space-y-1">
              {rankings.map((r) => (
                <div key={r.rank} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${r.team.id === selectedId ? "bg-accent/15" : "hover:bg-surface/30"}`}>
                  <div className="text-base font-bold text-fg-tertiary w-7 text-center">{r.rank}</div>
                  <img src={r.team.logo} alt={r.team.name} className="w-8 h-8 object-contain shrink-0" loading="lazy" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{r.team.name}</p>
                    <p className="text-[10px] text-fg-tertiary">{r.team.record}</p>
                  </div>
                  {r.points && <div className="text-xs text-fg-tertiary font-mono">{r.points} p</div>}
                  {r.trend ? (r.trend > 0 ? <TrendingUp size={14} className="text-green-400" /> : <TrendingDown size={14} className="text-red-400" />) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

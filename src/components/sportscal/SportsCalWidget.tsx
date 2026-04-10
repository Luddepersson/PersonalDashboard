"use client";

import { useState, useEffect, useRef } from "react";
import GlassCard from "../GlassCard";

interface CalEvent {
  sport: "NFL" | "NBA";
  emoji: string;
  teamAbbr: string;
  opponent: string;
  date: string;
  sortKey: number;
  color: string;
}

const NFL_OPPONENTS = ["KC", "SF", "PHI", "DAL", "BUF", "BAL", "MIA", "DET", "CIN", "MIN", "GB", "SEA"];
const NBA_OPPONENTS = ["LAL", "BOS", "GSW", "MIL", "DEN", "PHX", "MIA", "NYK", "PHI", "DAL", "CLE", "OKC"];

function seed(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function seededRandom(s: number, i: number): number {
  const x = Math.sin(s * 9301 + i * 49297 + 233280) * 10000;
  return x - Math.floor(x);
}

function generateEvents(teamAbbr: string, sport: "NFL" | "NBA"): CalEvent[] {
  const s = seed(teamAbbr + sport);
  const opponents = sport === "NFL" ? NFL_OPPONENTS : NBA_OPPONENTS;
  const filtered = opponents.filter((o) => o !== teamAbbr);
  const emoji = sport === "NFL" ? "🏈" : "🏀";
  const color = sport === "NFL" ? "#22c55e" : "#f97316";

  const months = ["apr", "apr", "apr", "maj", "maj"];
  const baseDays = [10, 15, 21, 2, 9];

  return baseDays.map((day, i) => {
    const opp = filtered[(s + i * 3) % filtered.length];
    const adjustedDay = day + Math.floor(seededRandom(s, i) * 5);
    const month = months[i];
    return {
      sport,
      emoji,
      teamAbbr,
      opponent: opp,
      date: `${adjustedDay} ${month}`,
      sortKey: (month === "apr" ? 4 : 5) * 100 + adjustedDay,
      color,
    };
  });
}

export default function SportsCalWidget() {
  const [nflTeam, setNflTeam] = useState<string | null>(null);
  const [nbaTeam, setNbaTeam] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    setNflTeam(localStorage.getItem("dashboard-nfl-team"));
    setNbaTeam(localStorage.getItem("dashboard-nba-team"));
    setMounted(true);

    // Listen for storage changes from other widgets
    const handler = () => {
      if (!mountedRef.current) return;
      setNflTeam(localStorage.getItem("dashboard-nfl-team"));
      setNbaTeam(localStorage.getItem("dashboard-nba-team"));
    };
    window.addEventListener("storage", handler);
    return () => {
      mountedRef.current = false;
      window.removeEventListener("storage", handler);
    };
  }, []);

  if (!mounted) {
    return (
      <GlassCard className="flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
      </GlassCard>
    );
  }

  const hasTeams = nflTeam || nbaTeam;

  if (!hasTeams) {
    return (
      <GlassCard className="flex flex-col h-[280px] items-center justify-center">
        <p className="text-sm text-fg-tertiary text-center px-4">
          Välj lag i NFL- och NBA-widgetarna
        </p>
      </GlassCard>
    );
  }

  const allEvents: CalEvent[] = [];
  if (nflTeam) allEvents.push(...generateEvents(nflTeam, "NFL"));
  if (nbaTeam) allEvents.push(...generateEvents(nbaTeam, "NBA"));

  const sortedEvents = allEvents
    .sort((a, b) => a.sortKey - b.sortKey)
    .slice(0, 5);

  return (
    <GlassCard className="flex flex-col h-[280px]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm">📅</span>
        <h3 className="text-sm font-semibold text-foreground">Sportkalender</h3>
        <span className="text-[10px] text-fg-tertiary ml-auto">Kommande</span>
      </div>

      {/* Event list */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1">
        {sortedEvents.map((event, i) => (
          <div
            key={`${event.sport}-${event.teamAbbr}-${i}`}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-surface/40 hover:bg-surface/60 transition-colors"
          >
            {/* Sport icon */}
            <span className="text-base leading-none">{event.emoji}</span>

            {/* Team + opponent */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  className="text-xs font-bold"
                  style={{ color: event.color }}
                >
                  {event.teamAbbr}
                </span>
                <span className="text-[11px] text-fg-secondary">vs {event.opponent}</span>
              </div>
              <p className="text-[10px] text-fg-tertiary">{event.sport}</p>
            </div>

            {/* Date */}
            <span className="text-[11px] text-fg-tertiary whitespace-nowrap">{event.date}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-separator">
        {nflTeam && (
          <span className="text-[10px] text-fg-tertiary">
            🏈 {nflTeam}
          </span>
        )}
        {nbaTeam && (
          <span className="text-[10px] text-fg-tertiary">
            🏀 {nbaTeam}
          </span>
        )}
      </div>
    </GlassCard>
  );
}

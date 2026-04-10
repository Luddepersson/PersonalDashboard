"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { sv } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, X, Clock, ArrowLeft, Users, Trash2 } from "lucide-react";
import GlassCard from "@/components/GlassCard";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  color: string;
  createdBy: string;
}

const MEMBER_COLORS = ["#0e88b0", "#e07a5f", "#69db7c", "#da77f2", "#ffa94d", "#d4b896", "#ff6b6b", "#51cf66"];

export default function TeamCalendarPage() {
  const params = useParams();
  const teamId = params.teamId as string;

  const [mounted, setMounted] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", time: "09:00", createdBy: "" });
  const [teamName, setTeamName] = useState("");

  const storageKey = `dashboard-team-calendar-${teamId}`;

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try { setEvents(JSON.parse(saved)); } catch { /* */ }
    }

    // Try to fetch team name
    fetch(`/api/teams/${teamId}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (data?.name) setTeamName(data.name); })
      .catch(() => { /* */ });
  }, [teamId, storageKey]);

  function save(updated: CalendarEvent[]) {
    setEvents(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  }

  function addEvent() {
    if (!newEvent.title.trim()) return;
    const memberName = newEvent.createdBy.trim() || "Anonym";
    // Assign color based on member name hash
    let hash = 0;
    for (let i = 0; i < memberName.length; i++) {
      hash = memberName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % MEMBER_COLORS.length;

    save([
      ...events,
      {
        id: Date.now().toString(),
        title: newEvent.title.trim(),
        date: format(selectedDate, "yyyy-MM-dd"),
        time: newEvent.time,
        color: MEMBER_COLORS[colorIndex],
        createdBy: memberName,
      },
    ]);
    setNewEvent({ title: "", time: "09:00", createdBy: newEvent.createdBy });
    setShowAdd(false);
  }

  function deleteEvent(id: string) {
    save(events.filter((e) => e.id !== id));
  }

  if (!mounted) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="h-[600px] rounded-xl bg-separator/20 animate-pulse" />
      </div>
    );
  }

  const monthStart = startOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 });
  const days: Date[] = [];
  let d = calStart;
  while (d <= calEnd) {
    days.push(d);
    d = addDays(d, 1);
  }

  const selStr = format(selectedDate, "yyyy-MM-dd");
  const selEvents = events
    .filter((e) => e.date === selStr)
    .sort((a, b) => a.time.localeCompare(b.time));

  // Build event map for dots
  const eventMap: Record<string, { count: number; colors: string[] }> = {};
  events.forEach((e) => {
    if (!eventMap[e.date]) eventMap[e.date] = { count: 0, colors: [] };
    eventMap[e.date].count++;
    if (!eventMap[e.date].colors.includes(e.color)) eventMap[e.date].colors.push(e.color);
  });

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back link */}
      <Link
        href={`/teams/${teamId}/dashboard`}
        className="inline-flex items-center gap-1.5 text-sm text-fg-secondary hover:text-accent transition-colors mb-6"
      >
        <ArrowLeft size={14} />
        Tillbaka till {teamName || "teamet"}
      </Link>

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
          <Users size={20} className="text-accent" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            Teamkalender
          </h1>
          {teamName && <p className="text-xs text-fg-tertiary">{teamName}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar grid — large */}
        <GlassCard className="lg:col-span-2 flex flex-col" hover3d={false}>
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-foreground capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: sv })}
            </h2>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="btn-ghost !p-2 rounded-lg"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => {
                  setCurrentMonth(new Date());
                  setSelectedDate(new Date());
                }}
                className="btn-ghost !px-3 !py-1.5 rounded-lg text-xs"
              >
                Idag
              </button>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="btn-ghost !p-2 rounded-lg"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-3">
            {["Mandag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lordag", "Sondag"].map((day) => (
              <div key={day} className="text-center text-xs text-fg-tertiary font-medium py-2">
                {day.slice(0, 3)}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1 flex-1">
            {days.map((day, i) => {
              const inMonth = isSameMonth(day, monthStart);
              const selected = isSameDay(day, selectedDate);
              const todayDate = isToday(day);
              const dateStr = format(day, "yyyy-MM-dd");
              const dayEvents = eventMap[dateStr];

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    relative text-sm py-3 rounded-xl transition-all text-center min-h-[56px]
                    ${!inMonth ? "text-fg-tertiary/20" : "text-fg-secondary hover:bg-separator/50"}
                    ${selected ? "bg-accent text-white font-semibold ring-2 ring-accent/30" : ""}
                    ${todayDate && !selected ? "text-accent font-bold" : ""}
                    ${dayEvents && !selected ? "bg-accent/5" : ""}
                  `}
                >
                  {format(day, "d")}

                  {/* Event dots */}
                  {dayEvents && !selected && (
                    <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-[3px]">
                      {dayEvents.colors.slice(0, 4).map((c, ci) => (
                        <span key={ci} className="w-[5px] h-[5px] rounded-full" style={{ background: c }} />
                      ))}
                    </span>
                  )}

                  {/* Today ring */}
                  {todayDate && !selected && (
                    <span className="absolute inset-0 rounded-xl border-2 border-accent/30 pointer-events-none" />
                  )}

                  {/* Event count badge */}
                  {dayEvents && dayEvents.count > 0 && selected && (
                    <span className="absolute top-1 right-1 text-[9px] bg-white/20 rounded-full w-4 h-4 flex items-center justify-center">
                      {dayEvents.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </GlassCard>

        {/* Sidebar — selected date details */}
        <div className="flex flex-col gap-4">
          <GlassCard className="flex flex-col" hover3d={false}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">
                {format(selectedDate, "d MMMM yyyy", { locale: sv })}
              </h3>
              <button
                onClick={() => setShowAdd(!showAdd)}
                className="btn-ghost !p-1.5 rounded-lg"
              >
                {showAdd ? <X size={14} /> : <Plus size={14} />}
              </button>
            </div>

            {/* Add event form */}
            {showAdd && (
              <div className="mb-3 p-3 rounded-xl bg-surface/30 space-y-2">
                <input
                  type="text"
                  placeholder="Handelsens titel..."
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && addEvent()}
                  className="input-base w-full !text-xs"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 input-base !py-1.5 !px-2.5">
                    <Clock size={12} className="text-fg-tertiary" />
                    <input
                      type="time"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                      className="bg-transparent text-xs text-foreground focus:outline-none"
                    />
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Ditt namn..."
                  value={newEvent.createdBy}
                  onChange={(e) => setNewEvent({ ...newEvent, createdBy: e.target.value })}
                  className="input-base w-full !text-xs"
                />
                <button
                  onClick={addEvent}
                  className="btn-primary !py-1.5 !px-4 !text-xs w-full flex items-center justify-center gap-1"
                >
                  <Plus size={12} /> Lagg till
                </button>
              </div>
            )}

            {/* Events list */}
            <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[350px]">
              {selEvents.length === 0 && !showAdd && (
                <p className="text-xs text-fg-tertiary text-center py-6">
                  Inga handelser denna dag
                </p>
              )}
              {selEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-2 py-2 px-2.5 rounded-lg hover:bg-surface/30 group transition-colors"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
                    style={{ background: event.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">{event.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-fg-tertiary font-mono">{event.time}</span>
                      <span className="text-[10px] text-fg-tertiary">av {event.createdBy}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteEvent(event.id)}
                    className="opacity-0 group-hover:opacity-100 btn-ghost !p-0.5 text-fg-tertiary hover:text-red-400 transition-opacity shrink-0"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Legend — who has events */}
          {events.length > 0 && (
            <GlassCard className="!p-3" hover3d={false}>
              <p className="text-[10px] text-fg-tertiary uppercase tracking-wider mb-2">Medlemmar</p>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(events.map((e) => e.createdBy))).map((name) => {
                  const event = events.find((e) => e.createdBy === name);
                  return (
                    <div key={name} className="flex items-center gap-1.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: event?.color }}
                      />
                      <span className="text-[11px] text-fg-secondary">{name}</span>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}

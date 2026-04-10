"use client";

import { useState, useEffect, useRef } from "react";
import {
  MapPin, Clock, Star, Search, ArrowRight, Bell, BellOff, X,
  ChevronDown, Train, Trash2,
} from "lucide-react";

/* ───────── types ───────── */

interface Trip {
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  legs: TripLeg[];
}

interface TripLeg {
  type: string;
  line: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
}

interface SavedRoute {
  id: string;
  from: string;
  to: string;
}

interface StopSuggestion {
  id: string;
  name: string;
}

/* ───────── constants ───────── */

const LS_KEY = "dashboard-transport-routes";
const ALARM_KEY = "dashboard-transport-alarm";

const TYPE_EMOJI: Record<string, string> = {
  bus: "🚌", metro: "🚇", train: "🚆", walk: "🚶", tram: "🚊",
};

const TYPE_COLORS: Record<string, string> = {
  bus: "#3b82f6", metro: "#ef4444", train: "#22c55e", walk: "#9ca3af", tram: "#f97316",
};

const TYPE_LABELS: Record<string, string> = {
  bus: "Buss", metro: "Tunnelbana", train: "Tag", walk: "Promenad", tram: "Sparvagn",
};

/* ───────── alarm sound ───────── */

function playAlarm() {
  try {
    const ctx = new AudioContext();
    [0, 0.2, 0.4].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = [880, 1100, 1320][i];
      osc.type = "sine";
      gain.gain.setValueAtTime(0.2, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.6);
      osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + 0.6);
    });
  } catch { /* ignore */ }
}

/* ───────── StopInput with autocomplete ───────── */

function StopInput({ value, onChange, onSelect, placeholder, large }: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (name: string) => void;
  placeholder: string;
  large?: boolean;
}) {
  const [suggestions, setSuggestions] = useState<StopSuggestion[]>([]);
  const [show, setShow] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  function handleChange(v: string) {
    onChange(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (v.length < 2) { setSuggestions([]); setShow(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/transport/autocomplete?q=${encodeURIComponent(v)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
          setShow(data.length > 0);
        }
      } catch { /* ignore */ }
    }, 250);
  }

  return (
    <div className="relative flex-1">
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setShow(true)}
        onBlur={() => setTimeout(() => setShow(false), 200)}
        placeholder={placeholder}
        className={`w-full bg-transparent border-none text-foreground placeholder-fg-tertiary focus:outline-none ${large ? "text-base" : "text-sm"}`}
        autoComplete="off"
      />
      {show && (
        <div
          className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl overflow-hidden shadow-lg"
          style={{ background: "var(--glass-bg)", backdropFilter: "blur(30px)", border: "1px solid var(--glass-border)" }}
        >
          {suggestions.map((s) => (
            <button
              key={s.id}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onSelect(s.name); onChange(s.name); setShow(false); }}
              className="w-full text-left px-4 py-3 text-sm text-foreground hover:bg-accent/10 transition-colors flex items-center gap-3"
            >
              <MapPin size={14} className="text-fg-tertiary shrink-0" />
              <span className="truncate">{s.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────── duration helpers ───────── */

function parseDuration(dur: string): number {
  // Accepts formats like "1h 23min", "45min", "PT1H23M"
  const hMatch = dur.match(/(\d+)\s*h/i);
  const mMatch = dur.match(/(\d+)\s*m/i);
  return (parseInt(hMatch?.[1] ?? "0") * 60) + parseInt(mMatch?.[1] ?? "0");
}

function legDuration(leg: TripLeg): string {
  if (!leg.departure || !leg.arrival) return "";
  const dep = leg.departure.split(":").map(Number);
  const arr = leg.arrival.split(":").map(Number);
  let mins = (arr[0] * 60 + arr[1]) - (dep[0] * 60 + dep[1]);
  if (mins < 0) mins += 24 * 60;
  if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}min`;
  return `${mins} min`;
}

/* ───────── main page component ───────── */

export default function TransportPage() {
  const [mounted, setMounted] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [expandedTrip, setExpandedTrip] = useState<number | null>(null);

  // Alarm
  const [alarmTime, setAlarmTime] = useState<string | null>(null);
  const [alarmFired, setAlarmFired] = useState(false);
  const [showAlarmInput, setShowAlarmInput] = useState(false);
  const [alarmInputVal, setAlarmInputVal] = useState("07:30");

  useEffect(() => {
    setMounted(true);
    try { const s = localStorage.getItem(LS_KEY); if (s) setSavedRoutes(JSON.parse(s)); } catch { /* ignore */ }
    try { const a = localStorage.getItem(ALARM_KEY); if (a) setAlarmTime(a); } catch { /* ignore */ }
    if (typeof Notification !== "undefined" && Notification.permission === "default") Notification.requestPermission();
  }, []);

  // Alarm checker
  useEffect(() => {
    if (!mounted || !alarmTime || alarmFired) return;
    function check() {
      const now = new Date();
      const [h, m] = alarmTime!.split(":").map(Number);
      if (now.getHours() === h && now.getMinutes() === m) {
        playAlarm(); setAlarmFired(true);
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification("Dags att ga!", { body: `Klockan ar ${alarmTime}` });
        }
      }
    }
    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, [mounted, alarmTime, alarmFired]);

  /* ── search ── */

  async function doSearch(fromVal: string, toVal: string) {
    setLoading(true); setSearchError("");
    try {
      const res = await fetch(`/api/transport/search?from=${encodeURIComponent(fromVal)}&to=${encodeURIComponent(toVal)}`);
      const data = await res.json();
      if (res.ok && data.trips?.length > 0) {
        setTrips(data.trips);
        setExpandedTrip(0);
      } else {
        setSearchError(data.error || "Inga resor hittades");
      }
    } catch { setSearchError("Natverksfel"); }
    setLoading(false);
  }

  function searchTrips() {
    if (from.trim() && to.trim()) doSearch(from.trim(), to.trim());
  }

  function saveRoute() {
    if (!from.trim() || !to.trim()) return;
    const route: SavedRoute = { id: Date.now().toString(), from: from.trim(), to: to.trim() };
    const updated = [route, ...savedRoutes.filter(r => !(r.from === route.from && r.to === route.to))].slice(0, 10);
    setSavedRoutes(updated);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
  }

  function deleteRoute(id: string) {
    const updated = savedRoutes.filter(r => r.id !== id);
    setSavedRoutes(updated);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
  }

  function loadRoute(route: SavedRoute) {
    setFrom(route.from); setTo(route.to);
    doSearch(route.from, route.to);
  }

  if (!mounted) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* ───── Header ───── */}
      <div>
        <div className="flex items-center gap-3">
          <Train size={28} className="text-accent" />
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tighter">Reseplanerare</h1>
            <p className="text-sm text-fg-secondary mt-0.5">Sok resor i hela Sverige</p>
          </div>
        </div>
      </div>

      {/* ───── Search Section ───── */}
      <div className="glass p-6 sm:p-8">
        <div className="flex gap-4">
          {/* Visual line */}
          <div className="flex flex-col items-center pt-3 pb-3">
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-emerald-400/30 shrink-0" />
            <div className="w-0.5 flex-1 bg-gradient-to-b from-emerald-400/50 to-red-400/50 my-1" />
            <div className="w-3.5 h-3.5 rounded-full bg-red-400 border-2 border-red-400/30 shrink-0" />
          </div>

          {/* Inputs */}
          <div className="flex-1 space-y-3">
            <div className="px-4 py-3 rounded-xl bg-surface/60 border border-glass-border">
              <label className="text-[10px] text-fg-tertiary uppercase tracking-wider font-semibold block mb-1">Fran</label>
              <StopInput value={from} onChange={setFrom} onSelect={setFrom} placeholder="Varifraan?" large />
            </div>
            <div className="px-4 py-3 rounded-xl bg-surface/60 border border-glass-border">
              <label className="text-[10px] text-fg-tertiary uppercase tracking-wider font-semibold block mb-1">Till</label>
              <StopInput value={to} onChange={setTo} onSelect={setTo} placeholder="Vart?" large />
            </div>
          </div>
        </div>

        {searchError && (
          <p className="text-sm text-red-400 mt-3 px-2">{searchError}</p>
        )}

        <div className="flex gap-3 mt-5">
          <button
            onClick={searchTrips}
            disabled={!from.trim() || !to.trim() || loading}
            className="btn-primary !py-3 !px-8 !text-sm flex items-center gap-2 flex-1 justify-center !rounded-xl font-semibold"
          >
            <Search size={16} />
            {loading ? "Soker..." : "Sok resa"}
          </button>
          {from.trim() && to.trim() && (
            <button
              onClick={saveRoute}
              className="btn-ghost p-3 rounded-xl border border-glass-border"
              title="Spara rutt"
            >
              <Star size={18} className="text-accent" />
            </button>
          )}
        </div>
      </div>

      {/* ───── Alarm Section ───── */}
      <div className="glass p-5">
        <div className="flex items-center gap-3">
          {alarmTime && !alarmFired ? (
            <>
              <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                <Bell size={18} className="text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Ga hemifran</p>
                <p className="text-xs text-fg-secondary">Paminnelse inlagd for <strong>{alarmTime}</strong></p>
              </div>
              <button onClick={() => { setAlarmTime(null); localStorage.removeItem(ALARM_KEY); }} className="btn-ghost p-2 rounded-lg">
                <X size={16} className="text-fg-tertiary" />
              </button>
            </>
          ) : alarmFired ? (
            <>
              <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center animate-bounce">
                <Bell size={18} className="text-orange-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-orange-400">Dags att ga!</p>
                <p className="text-xs text-fg-secondary">Det ar {alarmTime} -- skynda dig!</p>
              </div>
              <button onClick={() => { setAlarmTime(null); setAlarmFired(false); localStorage.removeItem(ALARM_KEY); }} className="btn-ghost p-2 rounded-lg">
                <X size={16} className="text-fg-tertiary" />
              </button>
            </>
          ) : showAlarmInput ? (
            <>
              <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center">
                <Clock size={18} className="text-fg-tertiary" />
              </div>
              <div className="flex-1 flex items-center gap-3">
                <input
                  type="time"
                  value={alarmInputVal}
                  onChange={(e) => setAlarmInputVal(e.target.value)}
                  className="bg-surface/60 border border-glass-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
                  autoFocus
                />
                <button
                  onClick={() => {
                    if (alarmInputVal) {
                      setAlarmTime(alarmInputVal);
                      localStorage.setItem(ALARM_KEY, alarmInputVal);
                      setShowAlarmInput(false);
                    }
                  }}
                  className="btn-primary !py-2 !px-4 !text-sm !rounded-lg"
                >
                  Satt alarm
                </button>
              </div>
              <button onClick={() => setShowAlarmInput(false)} className="btn-ghost p-2 rounded-lg">
                <X size={16} className="text-fg-tertiary" />
              </button>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center">
                <BellOff size={18} className="text-fg-tertiary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-fg-secondary">Ingen paminnelse</p>
                <p className="text-xs text-fg-tertiary">Stall in nar du behover ga hemifran</p>
              </div>
              <button
                onClick={() => { setAlarmInputVal("07:30"); setShowAlarmInput(true); }}
                className="btn-ghost text-sm text-accent font-medium px-3 py-1.5 rounded-lg"
              >
                + Lagg till
              </button>
            </>
          )}
        </div>
      </div>

      {/* ───── Saved Routes ───── */}
      {savedRoutes.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Sparade rutter</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {savedRoutes.map((r) => (
              <div
                key={r.id}
                className="glass p-4 flex items-center gap-3 cursor-pointer hover:bg-surface/60 transition-colors group"
                onClick={() => loadRoute(r)}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <div className="w-px h-4 bg-fg-tertiary/20" />
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground font-medium truncate">{r.from}</p>
                  <p className="text-sm text-fg-secondary truncate">{r.to}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteRoute(r.id); }}
                  className="opacity-0 group-hover:opacity-100 btn-ghost p-1.5 rounded-lg transition-opacity"
                >
                  <Trash2 size={14} className="text-fg-tertiary" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ───── Results Section ───── */}
      {trips.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-semibold text-foreground">Reseforslag</h2>
            <span className="text-xs text-fg-tertiary">
              {trips[0].origin} → {trips[0].destination}
            </span>
          </div>

          <div className="space-y-3">
            {trips.map((trip, i) => {
              const isExpanded = expandedTrip === i;
              const durationMins = parseDuration(trip.duration);

              return (
                <div key={i} className="glass overflow-hidden">
                  {/* Trip summary header */}
                  <button
                    onClick={() => setExpandedTrip(isExpanded ? null : i)}
                    className={`w-full p-5 text-left transition-colors ${isExpanded ? "bg-accent/5" : "hover:bg-surface/40"}`}
                  >
                    <div className="flex items-center justify-between">
                      {/* Times */}
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-xl font-bold text-foreground font-mono">{trip.departureTime}</p>
                          <p className="text-[10px] text-fg-tertiary uppercase">Avg</p>
                        </div>
                        <div className="flex flex-col items-center gap-1 px-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <div className="w-px h-4 bg-fg-tertiary/20" />
                          <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-bold text-foreground font-mono">{trip.arrivalTime}</p>
                          <p className="text-[10px] text-fg-tertiary uppercase">Ank</p>
                        </div>

                        {/* Duration badge */}
                        <div className="ml-4 px-3 py-1 rounded-full bg-surface/60 border border-glass-border">
                          <span className="text-xs font-medium text-fg-secondary">{trip.duration}</span>
                        </div>
                      </div>

                      {/* Transport lines */}
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {trip.legs.filter(l => l.type !== "walk").map((l, j) => (
                            <span
                              key={j}
                              className="text-xs px-2 py-1 rounded-lg font-semibold"
                              style={{ background: `${TYPE_COLORS[l.type] ?? "#666"}18`, color: TYPE_COLORS[l.type] ?? "#666" }}
                            >
                              {TYPE_EMOJI[l.type] || ""} {l.line}
                            </span>
                          ))}
                        </div>
                        <ChevronDown
                          size={16}
                          className={`text-fg-tertiary transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </div>
                    </div>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-0">
                      <div className="border-t border-glass-border pt-4">
                        <div className="space-y-0">
                          {trip.legs.map((leg, j) => {
                            const duration = legDuration(leg);
                            const color = TYPE_COLORS[leg.type] ?? "#666";
                            const isWalk = leg.type === "walk";

                            return (
                              <div key={j} className="flex gap-4">
                                {/* Visual timeline */}
                                <div className="flex flex-col items-center w-6 shrink-0">
                                  <div
                                    className="w-3 h-3 rounded-full border-2 shrink-0"
                                    style={{ borderColor: color, backgroundColor: isWalk ? "transparent" : color }}
                                  />
                                  {j < trip.legs.length - 1 && (
                                    <div className="w-0.5 flex-1 min-h-[2rem]" style={{ backgroundColor: `${color}40` }} />
                                  )}
                                </div>

                                {/* Leg content */}
                                <div className="flex-1 pb-4">
                                  {/* Transport badge */}
                                  <div className="flex items-center gap-2 mb-1">
                                    <span
                                      className="text-xs font-bold px-2 py-0.5 rounded-lg"
                                      style={{ background: `${color}18`, color }}
                                    >
                                      {TYPE_EMOJI[leg.type] || ""} {isWalk ? "Promenad" : `${TYPE_LABELS[leg.type] ?? leg.type} ${leg.line}`}
                                    </span>
                                    {duration && (
                                      <span className="text-[11px] text-fg-tertiary">{duration}</span>
                                    )}
                                  </div>

                                  {/* From */}
                                  <div className="flex items-center gap-2 text-sm">
                                    {!isWalk && (
                                      <span className="text-xs font-mono text-fg-secondary w-12">{leg.departure}</span>
                                    )}
                                    <span className="text-foreground">{leg.from}</span>
                                  </div>

                                  {/* To */}
                                  <div className="flex items-center gap-2 text-sm mt-0.5">
                                    {!isWalk && (
                                      <span className="text-xs font-mono text-fg-secondary w-12">{leg.arrival}</span>
                                    )}
                                    <span className="text-fg-secondary">{leg.to}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {/* Arrival dot */}
                          <div className="flex gap-4">
                            <div className="flex flex-col items-center w-6 shrink-0">
                              <div className="w-3 h-3 rounded-full bg-red-400 border-2 border-red-400/30" />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-fg-secondary w-12">{trip.arrivalTime}</span>
                              <span className="text-sm font-medium text-foreground">{trip.destination}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ───── Empty state ───── */}
      {trips.length === 0 && savedRoutes.length === 0 && !loading && (
        <div className="glass p-12 flex flex-col items-center justify-center gap-3 text-center">
          <Train size={32} className="text-fg-tertiary/50" />
          <div>
            <p className="text-sm text-fg-secondary">Sok efter din resa ovan</p>
            <p className="text-xs text-fg-tertiary mt-1">Sparade rutter visas har for snabb sokning</p>
          </div>
        </div>
      )}
    </div>
  );
}

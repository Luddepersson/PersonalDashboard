"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, Clock, Star, Search, ArrowRight, ArrowDown, Bell, BellOff, X, ChevronDown, Train } from "lucide-react";
import GlassCard from "../GlassCard";

interface Trip { origin: string; destination: string; departureTime: string; arrivalTime: string; duration: string; legs: TripLeg[]; }
interface TripLeg { type: string; line: string; from: string; to: string; departure: string; arrival: string; }
interface SavedRoute { id: string; from: string; to: string; }
interface StopSuggestion { id: string; name: string; }

const LS_KEY = "dashboard-transport-routes";
const ALARM_KEY = "dashboard-transport-alarm";
const TYPE_EMOJI: Record<string, string> = { bus: "🚌", metro: "🚇", train: "🚆", walk: "🚶", tram: "🚊" };
const TYPE_COLORS: Record<string, string> = { bus: "#3b82f6", metro: "#ef4444", train: "#22c55e", walk: "var(--foreground-tertiary)", tram: "#f97316" };

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
  } catch {}
}

function StopInput({ value, onChange, onSelect, placeholder, id }: {
  value: string; onChange: (v: string) => void; onSelect: (name: string) => void; placeholder: string; id?: string;
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
        if (res.ok) { const data = await res.json(); setSuggestions(data); setShow(data.length > 0); }
      } catch {}
    }, 250);
  }

  return (
    <div className="relative flex-1">
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setShow(true)}
        onBlur={() => setTimeout(() => setShow(false), 200)}
        placeholder={placeholder}
        className="w-full bg-transparent border-none text-xs text-foreground placeholder-fg-tertiary focus:outline-none"
        autoComplete="off"
      />
      {show && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-lg overflow-hidden shadow-lg" style={{ background: "var(--glass-bg)", backdropFilter: "blur(30px)", border: "1px solid var(--glass-border)" }}>
          {suggestions.map((s) => (
            <button
              key={s.id}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onSelect(s.name); onChange(s.name); setShow(false); }}
              className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-accent/10 transition-colors flex items-center gap-2"
            >
              <MapPin size={10} className="text-fg-tertiary shrink-0" />
              <span className="truncate">{s.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TransportWidget() {
  const [mounted, setMounted] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedTrip, setExpandedTrip] = useState<number | null>(null);
  const [showSearch, setShowSearch] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [searchError, setSearchError] = useState("");

  const [alarmTime, setAlarmTime] = useState<string | null>(null);
  const [alarmFired, setAlarmFired] = useState(false);
  const [showAlarmInput, setShowAlarmInput] = useState(false);
  const [alarmInputVal, setAlarmInputVal] = useState("");

  useEffect(() => {
    setMounted(true);
    try { const s = localStorage.getItem(LS_KEY); if (s) setSavedRoutes(JSON.parse(s)); } catch {}
    try { const a = localStorage.getItem(ALARM_KEY); if (a) setAlarmTime(a); } catch {}
    if (typeof Notification !== "undefined" && Notification.permission === "default") Notification.requestPermission();
  }, []);

  useEffect(() => {
    if (!mounted || !alarmTime || alarmFired) return;
    function check() {
      const now = new Date();
      const [h, m] = alarmTime!.split(":").map(Number);
      if (now.getHours() === h && now.getMinutes() === m) {
        playAlarm(); setAlarmFired(true);
        if (typeof Notification !== "undefined" && Notification.permission === "granted") new Notification("Dags att gå! 🚶", { body: `Klockan är ${alarmTime}` });
      }
    }
    check();
    const i = setInterval(check, 15000);
    return () => clearInterval(i);
  }, [mounted, alarmTime, alarmFired]);

  async function doSearch(fromVal: string, toVal: string) {
    setLoading(true); setSearchError("");
    try {
      const res = await fetch(`/api/transport/search?from=${encodeURIComponent(fromVal)}&to=${encodeURIComponent(toVal)}`);
      const data = await res.json();
      if (res.ok && data.trips?.length > 0) {
        setTrips(data.trips); setIsLive(true); setShowSearch(false); setExpandedTrip(0);
      } else {
        setSearchError(data.error || "Inga resor hittades");
      }
    } catch { setSearchError("Nätverksfel"); }
    setLoading(false);
  }

  function searchTrips() { if (from.trim() && to.trim()) doSearch(from.trim(), to.trim()); }

  function saveRoute() {
    if (!from.trim() || !to.trim()) return;
    const route: SavedRoute = { id: Date.now().toString(), from: from.trim(), to: to.trim() };
    const updated = [route, ...savedRoutes.filter(r => !(r.from === route.from && r.to === route.to))].slice(0, 5);
    setSavedRoutes(updated); localStorage.setItem(LS_KEY, JSON.stringify(updated));
  }

  function loadRoute(route: SavedRoute) {
    setFrom(route.from); setTo(route.to);
    doSearch(route.from, route.to);
  }

  if (!mounted) return <GlassCard className="flex items-center justify-center"><div className="h-6 w-24 rounded bg-separator animate-pulse" /></GlassCard>;

  return (
    <GlassCard className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Train size={13} className="text-accent" />
          <span className="text-xs font-semibold text-foreground tracking-tight">Reseplanerare</span>
        </div>
        <div className="flex items-center gap-1">
          {isLive && <span className="text-[7px] text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded-full font-bold tracking-wider">LIVE</span>}
          {trips.length > 0 && !showSearch && (
            <button onClick={() => { setShowSearch(true); setTrips([]); }} className="text-[9px] text-accent font-medium">Ny sökning</button>
          )}
        </div>
      </div>

      {/* Alarm */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-surface/40 mb-2 text-[10px]">
        {alarmTime && !alarmFired ? (
          <><Bell size={9} className="text-accent shrink-0" /><span className="text-foreground flex-1">Gå hemifrån: <strong>{alarmTime}</strong></span><button onClick={() => { setAlarmTime(null); localStorage.removeItem(ALARM_KEY); }} className="btn-ghost !p-0.5"><X size={8} /></button></>
        ) : alarmFired ? (
          <><Bell size={9} className="text-accent-warm shrink-0 animate-bounce" /><span className="text-accent-warm font-semibold flex-1">Dags att gå!</span><button onClick={() => { setAlarmTime(null); setAlarmFired(false); }} className="btn-ghost !p-0.5"><X size={8} /></button></>
        ) : showAlarmInput ? (
          <><Clock size={9} className="text-fg-tertiary" /><input type="time" value={alarmInputVal} onChange={(e) => setAlarmInputVal(e.target.value)} className="bg-transparent text-[10px] text-foreground focus:outline-none flex-1" autoFocus /><button onClick={() => { if (alarmInputVal) { setAlarmTime(alarmInputVal); localStorage.setItem(ALARM_KEY, alarmInputVal); setShowAlarmInput(false); } }} className="text-accent font-semibold">OK</button><button onClick={() => setShowAlarmInput(false)} className="btn-ghost !p-0.5"><X size={8} /></button></>
        ) : (
          <><BellOff size={9} className="text-fg-tertiary" /><span className="text-fg-tertiary flex-1">Påminnelse</span><button onClick={() => { setAlarmInputVal("07:30"); setShowAlarmInput(true); }} className="text-accent font-medium">+ Tid</button></>
        )}
      </div>

      {/* Search */}
      {showSearch && (
        <div className="space-y-1.5 mb-2">
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-surface/40">
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <div className="w-px h-3 bg-fg-tertiary/30" />
              <div className="w-2 h-2 rounded-full bg-red-400" />
            </div>
            <div className="flex-1 space-y-1">
              <StopInput value={from} onChange={setFrom} onSelect={setFrom} placeholder="Varifrån?" />
              <div className="h-px bg-separator" />
              <StopInput value={to} onChange={setTo} onSelect={setTo} placeholder="Vart?" id="transport-to" />
            </div>
          </div>

          {searchError && <p className="text-[9px] text-accent-warm px-1">{searchError}</p>}

          <div className="flex gap-1.5">
            <button onClick={searchTrips} disabled={!from.trim() || !to.trim() || loading} className="btn-primary !py-1.5 !px-3 !text-[10px] flex items-center gap-1.5 flex-1 justify-center !rounded-lg">
              <Search size={11} /> {loading ? "Söker..." : "Sök resa"}
            </button>
            {from.trim() && to.trim() && (
              <button onClick={saveRoute} className="btn-ghost !p-1.5 !rounded-lg" title="Spara rutt"><Star size={13} className="text-accent" /></button>
            )}
          </div>
        </div>
      )}

      {/* Saved routes */}
      {showSearch && trips.length === 0 && savedRoutes.length > 0 && (
        <div className="mb-1">
          <p className="text-[8px] text-fg-tertiary uppercase tracking-widest mb-1 px-0.5">Sparade</p>
          <div className="space-y-0.5">
            {savedRoutes.map((r) => (
              <div key={r.id} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-surface/30 group cursor-pointer hover:bg-surface/50 transition-colors" onClick={() => loadRoute(r)}>
                <Star size={8} className="text-accent/50 shrink-0" />
                <span className="text-[10px] text-foreground truncate">{r.from}</span>
                <ArrowRight size={8} className="text-fg-tertiary shrink-0" />
                <span className="text-[10px] text-foreground truncate">{r.to}</span>
                <button onClick={(e) => { e.stopPropagation(); const u = savedRoutes.filter(x => x.id !== r.id); setSavedRoutes(u); localStorage.setItem(LS_KEY, JSON.stringify(u)); }} className="ml-auto opacity-0 group-hover:opacity-100 btn-ghost !p-0.5"><X size={8} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {showSearch && trips.length === 0 && savedRoutes.length === 0 && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-1 opacity-40">
          <Train size={18} />
          <p className="text-[10px]">Sök din resa</p>
        </div>
      )}

      {/* Results */}
      {!showSearch && trips.length > 0 && (
        <div className="flex-1 overflow-y-auto -mr-1 pr-1 space-y-1">
          <div className="flex items-center gap-1.5 mb-1 px-0.5">
            <span className="text-[10px] text-fg-secondary font-medium truncate">{trips[0].origin}</span>
            <ArrowRight size={9} className="text-fg-tertiary" />
            <span className="text-[10px] text-fg-secondary font-medium truncate">{trips[0].destination}</span>
          </div>

          {trips.map((trip, i) => (
            <div key={i}>
              <button
                onClick={() => setExpandedTrip(expandedTrip === i ? null : i)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-all text-left ${expandedTrip === i ? "bg-accent/8 border border-accent/15" : "bg-surface/30 hover:bg-surface/50 border border-transparent"}`}
              >
                <div className="flex items-center gap-1.5">
                  <div className="text-center">
                    <p className="text-xs font-semibold text-foreground font-mono">{trip.departureTime}</p>
                    <p className="text-[8px] text-fg-tertiary">{trip.duration}</p>
                  </div>
                  <div className="flex flex-col items-center gap-0.5 px-1">
                    <div className="w-1 h-1 rounded-full bg-accent" />
                    <div className="w-px h-3 bg-fg-tertiary/20" />
                    <div className="w-1 h-1 rounded-full bg-accent-warm" />
                  </div>
                  <p className="text-xs font-semibold text-foreground font-mono">{trip.arrivalTime}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-px">
                    {trip.legs.filter(l => l.type !== "walk").map((l, j) => (
                      <span key={j} className="text-[9px] px-1 py-0.5 rounded font-semibold" style={{ background: `${TYPE_COLORS[l.type]}18`, color: TYPE_COLORS[l.type] }}>
                        {l.line}
                      </span>
                    ))}
                  </div>
                  <ChevronDown size={10} className={`text-fg-tertiary transition-transform ${expandedTrip === i ? "rotate-180" : ""}`} />
                </div>
              </button>

              {expandedTrip === i && (
                <div className="ml-3 pl-3 border-l-2 border-accent/15 space-y-1 py-1.5">
                  {trip.legs.map((leg, j) => (
                    <div key={j} className="flex items-start gap-2">
                      <span className="text-[10px] mt-0.5 shrink-0">{TYPE_EMOJI[leg.type] || "•"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold" style={{ color: TYPE_COLORS[leg.type] || "var(--foreground)" }}>{leg.line}</span>
                          {leg.type !== "walk" && <span className="text-[8px] text-fg-tertiary font-mono">{leg.departure} → {leg.arrival}</span>}
                        </div>
                        <p className="text-[9px] text-fg-tertiary">{leg.from} → {leg.to}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

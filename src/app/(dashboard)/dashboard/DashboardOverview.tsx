"use client";

import { useState, useEffect, useCallback, useRef, lazy, Suspense, memo } from "react";
import { Settings2, X, Check, GripVertical, Maximize2, Minimize2 } from "lucide-react";
import StatsBar from "@/components/StatsBar";

// Lazy load widgets so they don't slow down initial render
const ClockWidget = lazy(() => import("@/components/ClockWidget"));
const WeatherWidget = lazy(() => import("@/components/WeatherWidget"));
const PomodoroWidget = lazy(() => import("@/components/PomodoroWidget"));
const CalendarWidget = lazy(() => import("@/components/CalendarWidget"));
const NotesWidget = lazy(() => import("@/components/NotesWidget"));
const HabitTracker = lazy(() => import("@/components/HabitTracker"));
const GitHubWidget = lazy(() => import("@/components/GitHubWidget"));
const SpotifyWidget = lazy(() => import("@/components/SpotifyWidget"));
const QuickLinksWidget = lazy(() => import("@/components/QuickLinksWidget"));
const MarkdownNotesWidget = lazy(() => import("@/components/MarkdownNotesWidget"));
const DailySummary = lazy(() => import("@/components/DailySummary"));
const ExportImport = lazy(() => import("@/components/ExportImport"));
const AIAssistant = lazy(() => import("@/components/AIAssistant"));
const M365Widget = lazy(() => import("@/components/M365Widget"));
const BookmarksWidget = lazy(() => import("@/components/BookmarksWidget"));
const AgendaWidget = lazy(() => import("@/components/agenda/AgendaWidget"));
const TimeTrackWidget = lazy(() => import("@/components/timetrack/TimeTrackWidget"));
const GoalsWidget = lazy(() => import("@/components/goals/GoalsWidget"));
const ScratchPad = lazy(() => import("@/components/ScratchPad"));
const CountdownWidget = lazy(() => import("@/components/countdown/CountdownWidget"));
const RSSWidget = lazy(() => import("@/components/rss/RSSWidget"));
const CurrencyWidget = lazy(() => import("@/components/currency/CurrencyWidget"));
const StockWidget = lazy(() => import("@/components/stocks/StockWidget"));
const QuoteWidget = lazy(() => import("@/components/quote/QuoteWidget"));
const SystemMonitor = lazy(() => import("@/components/sysmon/SystemMonitor"));
const StatusWidget = lazy(() => import("@/components/status/StatusWidget"));
const FileWidget = lazy(() => import("@/components/fileshare/FileWidget"));
const WebhookWidget = lazy(() => import("@/components/WebhookWidget"));
const ShareDashboard = lazy(() => import("@/components/ShareDashboard"));
const NFLWidget = lazy(() => import("@/components/nfl/NFLWidget"));
const NBAWidget = lazy(() => import("@/components/nba/NBAWidget"));
const CFBWidget = lazy(() => import("@/components/cfb/CFBWidget"));
const SportsCalWidget = lazy(() => import("@/components/sportscal/SportsCalWidget"));
const MealPrepWidget = lazy(() => import("@/components/meals/MealPrepWidget"));
const MovieWidget = lazy(() => import("@/components/movies/MovieWidget"));
const TransportWidget = lazy(() => import("@/components/transport/TransportWidget"));

interface WidgetDef {
  id: string;
  label: string;
  tall?: boolean; // takes 2 rows
  component: React.LazyExoticComponent<React.ComponentType>;
}

const ALL_WIDGETS: WidgetDef[] = [
  { id: "summary", label: "Daglig sammanfattning", component: DailySummary },
  { id: "clock", label: "Klocka", component: ClockWidget },
  { id: "weather", label: "Väder", component: WeatherWidget },
  { id: "pomodoro", label: "Pomodoro", component: PomodoroWidget },
  { id: "calendar", label: "Kalender", tall: true, component: CalendarWidget },
  { id: "todos", label: "Uppgifter", component: NotesWidget },
  { id: "habits", label: "Vanor", component: HabitTracker },
  { id: "github", label: "GitHub", component: GitHubWidget },
  { id: "notes", label: "Anteckningar", component: MarkdownNotesWidget },
  { id: "spotify", label: "Musik", component: SpotifyWidget },
  { id: "links", label: "Snabblänkar", component: QuickLinksWidget },
  { id: "m365", label: "Microsoft 365", component: M365Widget },
  { id: "bookmarks", label: "Favoriter", component: BookmarksWidget },
  { id: "agenda", label: "Veckoagenda", component: AgendaWidget },
  { id: "timetrack", label: "Tidrapport", component: TimeTrackWidget },
  { id: "goals", label: "Mål", component: GoalsWidget },
  { id: "scratch", label: "Kladdblad", component: ScratchPad },
  { id: "countdown", label: "Nedräkning", component: CountdownWidget },
  { id: "rss", label: "Nyhetsflöde", component: RSSWidget },
  { id: "currency", label: "Valuta", component: CurrencyWidget },
  { id: "stocks", label: "Aktier", component: StockWidget },
  { id: "quote", label: "Dagens citat", component: QuoteWidget },
  { id: "sysmon", label: "System", component: SystemMonitor },
  { id: "status", label: "Min status", component: StatusWidget },
  { id: "files", label: "Filer", component: FileWidget },
  { id: "webhooks", label: "Webhooks", component: WebhookWidget },
  { id: "share", label: "Dela dashboard", component: ShareDashboard },
  { id: "nfl", label: "NFL", component: NFLWidget },
  { id: "nba", label: "NBA", component: NBAWidget },
  { id: "cfb", label: "College Football", component: CFBWidget },
  { id: "sportscal", label: "Sportkalender", component: SportsCalWidget },
  { id: "meals", label: "Måltidsplanering", component: MealPrepWidget },
  { id: "movies", label: "Film & Serier", component: MovieWidget },
  { id: "transport", label: "Kollektivtrafik", component: TransportWidget },
  { id: "ai", label: "AI Assistent", component: AIAssistant },
  { id: "export", label: "Export/Import", component: ExportImport },
];

interface WidgetState {
  enabled: string[];
  wide: string[]; // IDs of widgets that span 2 columns
}

const DEFAULT_STATE: WidgetState = {
  enabled: ["summary", "clock", "weather", "pomodoro", "calendar", "todos", "habits"],
  wide: [],
};

function WidgetSkeleton() {
  return (
    <div className="glass p-5 h-full flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-fg-tertiary/20 border-t-accent/50 animate-spin" />
    </div>
  );
}

export default function DashboardOverview() {
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<WidgetState>(DEFAULT_STATE);
  const [editing, setEditing] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragCounter = useRef(0);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("dashboard-layout");
    if (saved) { try { setState(JSON.parse(saved)); } catch { /* */ } }
  }, []);

  const save = useCallback((s: WidgetState) => {
    setState(s);
    localStorage.setItem("dashboard-layout", JSON.stringify(s));
  }, []);

  function toggle(id: string) {
    save({
      ...state,
      enabled: state.enabled.includes(id)
        ? state.enabled.filter((w) => w !== id)
        : [...state.enabled, id],
    });
  }

  function toggleWide(id: string) {
    save({
      ...state,
      wide: state.wide.includes(id)
        ? state.wide.filter((w) => w !== id)
        : [...state.wide, id],
    });
  }

  // Drag & drop in the actual grid
  function onDragStart(id: string) { setDragId(id); }

  function onDragEnter(id: string) {
    dragCounter.current++;
    setDragOverId(id);
  }

  function onDragLeave() {
    dragCounter.current--;
    if (dragCounter.current <= 0) { setDragOverId(null); dragCounter.current = 0; }
  }

  function onDrop(targetId: string) {
    if (!dragId || dragId === targetId) { setDragId(null); setDragOverId(null); dragCounter.current = 0; return; }
    const list = [...state.enabled];
    const from = list.indexOf(dragId);
    const to = list.indexOf(targetId);
    if (from === -1 || to === -1) return;
    list.splice(from, 1);
    list.splice(to, 0, dragId);
    save({ ...state, enabled: list });
    setDragId(null);
    setDragOverId(null);
    dragCounter.current = 0;
  }

  if (!mounted) return null;

  const activeWidgets = state.enabled
    .map((id) => ALL_WIDGETS.find((w) => w.id === id))
    .filter(Boolean) as WidgetDef[];

  return (
    <div>
      <StatsBar />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] text-fg-secondary uppercase tracking-[0.04em] font-medium">
          {editing ? "Redigera layout" : "Widgets"}
        </p>
        <button
          onClick={() => setEditing(!editing)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all ${
            editing
              ? "bg-accent text-white"
              : "text-fg-tertiary hover:text-accent hover:bg-accent-subtle/50"
          }`}
        >
          {editing ? <Check size={13} /> : <Settings2 size={13} />}
          {editing ? "Klar" : "Anpassa"}
        </button>
      </div>

      {/* Widget picker — only when editing */}
      {editing && (
        <div className="glass !p-3 sm:!p-4 mb-4 animate-in max-h-[60vh] overflow-y-auto">
          <p className="text-xs text-fg-secondary mb-3">Klicka för att visa/dölja. Dra widgets i gridet för att ändra ordning.</p>
          <div className="flex flex-wrap gap-1.5">
            {ALL_WIDGETS.map((w) => {
              const on = state.enabled.includes(w.id);
              return (
                <button
                  key={w.id}
                  onClick={() => toggle(w.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${
                    on ? "border-accent/30 bg-accent-subtle text-accent" : "border-separator text-fg-tertiary hover:border-accent/15"
                  }`}
                >
                  {on ? <Check size={10} strokeWidth={3} /> : <span className="w-2.5" />}
                  {w.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Widget grid */}
      {activeWidgets.length === 0 ? (
        <div className="glass p-12 text-center">
          <p className="text-fg-secondary mb-2">Inga widgets valda</p>
          <p className="text-xs text-fg-tertiary">Klicka &quot;Anpassa&quot; för att lägga till</p>
        </div>
      ) : (
        <div className="widget-grid grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {activeWidgets.map((w) => {
            const isWide = state.wide.includes(w.id);
            const isDragging = dragId === w.id;
            const isOver = dragOverId === w.id && dragId !== w.id;
            const C = w.component;

            return (
              <div
                key={w.id}
                draggable={editing}
                onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStart(w.id); }}
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={() => onDragEnter(w.id)}
                onDragLeave={onDragLeave}
                onDrop={(e) => { e.preventDefault(); onDrop(w.id); }}
                onDragEnd={() => { setDragId(null); setDragOverId(null); dragCounter.current = 0; }}
                className={`
                  relative transition-all duration-200
                  ${isWide ? "sm:col-span-2 max-sm:!col-span-1" : ""}
                  ${w.tall ? "sm:row-span-2" : ""}
                  ${editing ? "cursor-grab active:cursor-grabbing" : ""}
                  ${isDragging ? "opacity-40 scale-95" : ""}
                  ${isOver ? "ring-2 ring-accent/40 ring-offset-2 ring-offset-transparent rounded-[1.25rem]" : ""}
                `}
              >
                {/* Edit overlay with resize toggle */}
                {editing && (
                  <div className="absolute top-2 right-2 z-10 flex gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleWide(w.id); }}
                      className="p-1.5 rounded-lg bg-black/40 backdrop-blur text-white/70 hover:text-white transition-colors"
                      title={isWide ? "Normal storlek" : "Bred"}
                    >
                      {isWide ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggle(w.id); }}
                      className="p-1.5 rounded-lg bg-black/40 backdrop-blur text-white/70 hover:text-red-400 transition-colors"
                      title="Ta bort"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                {/* Drag handle indicator */}
                {editing && (
                  <div className="absolute top-2 left-2 z-10 p-1 rounded-lg bg-black/40 backdrop-blur text-white/50">
                    <GripVertical size={12} />
                  </div>
                )}

                {/* Widget content */}
                <div className={`${w.tall ? "h-[500px] sm:h-[576px]" : "h-[240px] sm:h-[280px]"} [&>.glass]:h-full [&>.glass]:overflow-hidden [&>.glass]:flex [&>.glass]:flex-col [&>div]:h-full`}>
                  <Suspense fallback={<WidgetSkeleton />}>
                    <C />
                  </Suspense>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

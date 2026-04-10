"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Clock, CloudSun, Timer, CalendarDays, ListTodo, Target, GitBranch,
  Music, Link2, FileText, BarChart3, Star, Zap, StickyNote, CalendarClock,
  Rss, DollarSign, TrendingUp, Quote, Cpu, UserCheck, Upload, Webhook,
  Share2, Sparkles, Download, Layout, Trophy, Film, UtensilsCrossed, Train,
} from "lucide-react";

interface WidgetInfo {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: string;
}

const WIDGETS: WidgetInfo[] = [
  // Produktivitet
  { id: "summary", label: "Daglig sammanfattning", description: "Översikt av dagens progress med mål och vanor", icon: <BarChart3 size={20} />, category: "Produktivitet" },
  { id: "clock", label: "Klocka", description: "Digital klocka med datum", icon: <Clock size={20} />, category: "Produktivitet" },
  { id: "pomodoro", label: "Pomodoro", description: "Fokustimer med pauser och statistik", icon: <Timer size={20} />, category: "Produktivitet" },
  { id: "calendar", label: "Kalender", description: "Månadsvy med påminnelser och notifikationer", icon: <CalendarDays size={20} />, category: "Produktivitet" },
  { id: "todos", label: "Uppgifter", description: "Att-göra-lista med progress", icon: <ListTodo size={20} />, category: "Produktivitet" },
  { id: "habits", label: "Vanor", description: "Spåra dagliga vanor med veckoöversikt", icon: <Target size={20} />, category: "Produktivitet" },
  { id: "agenda", label: "Veckoagenda", description: "Tidslinje med veckans händelser", icon: <CalendarDays size={20} />, category: "Produktivitet" },
  { id: "timetrack", label: "Tidrapport", description: "Logga arbetstid per projekt", icon: <Timer size={20} />, category: "Produktivitet" },
  { id: "goals", label: "Mål", description: "Sätt och följ upp vecko- och månadsmål", icon: <Target size={20} />, category: "Produktivitet" },
  { id: "scratch", label: "Kladdblad", description: "Snabb anteckning som sparas automatiskt", icon: <StickyNote size={20} />, category: "Produktivitet" },
  { id: "countdown", label: "Nedräkning", description: "Räkna ner till viktiga datum", icon: <CalendarClock size={20} />, category: "Produktivitet" },
  { id: "notes", label: "Anteckningar", description: "Markdown-anteckningar med förhandsvisning", icon: <FileText size={20} />, category: "Produktivitet" },

  // Data & Integration
  { id: "weather", label: "Väder", description: "Aktuellt väder med prognos", icon: <CloudSun size={20} />, category: "Data & Integration" },
  { id: "github", label: "GitHub", description: "Aktivitetsöversikt och senaste repos", icon: <GitBranch size={20} />, category: "Data & Integration" },
  { id: "rss", label: "Nyhetsflöde", description: "RSS-läsare med anpassade feeds", icon: <Rss size={20} />, category: "Data & Integration" },
  { id: "currency", label: "Valuta", description: "Omvandla mellan SEK, EUR, USD, GBP", icon: <DollarSign size={20} />, category: "Data & Integration" },
  { id: "stocks", label: "Aktier", description: "Följ aktiekurser med trendvisning", icon: <TrendingUp size={20} />, category: "Data & Integration" },
  { id: "sysmon", label: "System", description: "Batteri, minne och nätverksstatus", icon: <Cpu size={20} />, category: "Data & Integration" },

  // Verktyg
  { id: "m365", label: "Microsoft 365", description: "Snabblänkar till Word, Excel, PowerPoint m.fl.", icon: <Layout size={20} />, category: "Verktyg" },
  { id: "links", label: "Snabblänkar", description: "Anpassade genvägar till appar och sidor", icon: <Link2 size={20} />, category: "Verktyg" },
  { id: "bookmarks", label: "Favoriter", description: "Bokmärken med favicon till webbsidor", icon: <Star size={20} />, category: "Verktyg" },
  { id: "spotify", label: "Musik", description: "Musiklista med spelarkontroller", icon: <Music size={20} />, category: "Verktyg" },
  { id: "quote", label: "Dagens citat", description: "Dagligt inspirerande citat", icon: <Quote size={20} />, category: "Verktyg" },
  { id: "ai", label: "AI Assistent", description: "Jarvis — din produktivitetsassistent", icon: <Sparkles size={20} />, category: "Verktyg" },

  // Avancerat
  { id: "status", label: "Min status", description: "Visa tillgänglighet för teamet", icon: <UserCheck size={20} />, category: "Avancerat" },
  { id: "files", label: "Filer", description: "Drag & drop filhantering", icon: <Upload size={20} />, category: "Avancerat" },
  { id: "webhooks", label: "Webhooks", description: "Ta emot händelser från andra tjänster", icon: <Webhook size={20} />, category: "Avancerat" },
  { id: "share", label: "Dela dashboard", description: "Skapa publik länk till din dashboard", icon: <Share2 size={20} />, category: "Avancerat" },
  { id: "export", label: "Export/Import", description: "Säkerhetskopiera och återställ all data", icon: <Download size={20} />, category: "Avancerat" },

  // Sport & Livsstil
  { id: "nfl", label: "NFL", description: "Följ ditt NFL-lag med resultat och schema", icon: <Trophy size={20} />, category: "Sport & Livsstil" },
  { id: "nba", label: "NBA", description: "NBA-resultat, standings och matcher", icon: <Trophy size={20} />, category: "Sport & Livsstil" },
  { id: "cfb", label: "College Football", description: "NCAA-resultat, rankings och nyheter", icon: <Trophy size={20} />, category: "Sport & Livsstil" },
  { id: "sportscal", label: "Sportkalender", description: "Kommande matcher för dina lag", icon: <CalendarDays size={20} />, category: "Sport & Livsstil" },
  { id: "meals", label: "Måltidsplanering", description: "Planera veckans frukost, lunch och middag", icon: <UtensilsCrossed size={20} />, category: "Sport & Livsstil" },
  { id: "movies", label: "Film & Serier", description: "Spåra filmer och serier du vill se", icon: <Film size={20} />, category: "Sport & Livsstil" },
  { id: "transport", label: "Kollektivtrafik", description: "Nästa avgång från din hållplats", icon: <Train size={20} />, category: "Sport & Livsstil" },
];

const CATEGORIES = ["Produktivitet", "Data & Integration", "Verktyg", "Sport & Livsstil", "Avancerat"];

export default function WidgetStorePage() {
  const [mounted, setMounted] = useState(false);
  const [enabled, setEnabled] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("dashboard-layout");
    if (saved) {
      try { setEnabled(JSON.parse(saved).enabled || []); } catch {}
    }
  }, []);

  function toggleWidget(id: string) {
    const saved = localStorage.getItem("dashboard-layout");
    let state = { enabled: [] as string[], wide: [] as string[] };
    if (saved) { try { state = JSON.parse(saved); } catch {} }

    if (state.enabled.includes(id)) {
      state.enabled = state.enabled.filter((w) => w !== id);
    } else {
      state.enabled = [...state.enabled, id];
    }

    localStorage.setItem("dashboard-layout", JSON.stringify(state));
    setEnabled(state.enabled);
  }

  if (!mounted) return null;

  const filtered = search
    ? WIDGETS.filter((w) => w.label.toLowerCase().includes(search.toLowerCase()) || w.description.toLowerCase().includes(search.toLowerCase()))
    : WIDGETS;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Widgets</h1>
        <p className="text-sm text-fg-secondary mt-1">Välj vilka widgets du vill ha på din dashboard</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Sök widgets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-base w-full !py-3 !text-sm"
        />
      </div>

      {/* Stats */}
      <div className="glass p-4 mb-6 flex items-center justify-between">
        <p className="text-sm text-fg-secondary">
          <span className="text-foreground font-semibold">{enabled.length}</span> av {WIDGETS.length} widgets aktiva
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="btn-primary !py-2 !px-4 !text-xs flex items-center gap-1.5"
        >
          <Layout size={13} /> Visa dashboard
        </button>
      </div>

      {/* Categories */}
      {CATEGORIES.map((cat) => {
        const catWidgets = filtered.filter((w) => w.category === cat);
        if (catWidgets.length === 0) return null;

        return (
          <div key={cat} className="mb-8">
            <h2 className="text-xs font-semibold text-fg-tertiary uppercase tracking-[0.1em] mb-3">{cat}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {catWidgets.map((w) => {
                const isOn = enabled.includes(w.id);
                return (
                  <button
                    key={w.id}
                    onClick={() => toggleWidget(w.id)}
                    className={`glass !p-4 text-left transition-all group ${
                      isOn ? "!border-accent/30" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isOn ? "bg-accent/15 text-accent" : "bg-surface text-fg-tertiary group-hover:text-fg-secondary"
                      }`}>
                        {w.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="text-sm font-medium text-foreground">{w.label}</h3>
                          {isOn && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent/15 text-accent font-medium">Aktiv</span>}
                        </div>
                        <p className="text-xs text-fg-tertiary leading-relaxed">{w.description}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                        isOn ? "border-accent bg-accent" : "border-fg-tertiary/30"
                      }`}>
                        {isOn && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

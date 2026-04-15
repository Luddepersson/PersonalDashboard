"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Clock, CloudSun, ListTodo, CalendarDays,
  Timer, Target, Train, Trophy, ArrowLeft, Info, Sparkles, Moon,
  Palette, LogIn,
} from "lucide-react";
import { ThemeProvider, useTheme, THEMES, type ThemeId } from "@/components/ThemeProvider";
import ParticlesBackground from "@/components/ParticlesBackground";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";

// Lazy load widgets
const ClockWidget = lazy(() => import("@/components/ClockWidget"));
const WeatherWidget = lazy(() => import("@/components/WeatherWidget"));
const PomodoroWidget = lazy(() => import("@/components/PomodoroWidget"));
const CalendarWidget = lazy(() => import("@/components/CalendarWidget"));
const NotesWidget = lazy(() => import("@/components/NotesWidget"));

function WidgetSkeleton() {
  return (
    <div className="glass flex items-center justify-center h-[280px]">
      <div className="w-8 h-8 rounded-full border-2 border-fg-tertiary/20 border-t-accent/50 animate-spin" />
    </div>
  );
}

function DemoContent() {
  const [mounted, setMounted] = useState(false);
  const { theme, setThemeById } = useTheme();
  const [showThemes, setShowThemes] = useState(false);
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  return (
    <div className="bg-mesh min-h-screen overflow-x-hidden">
      <ParticlesBackground />
      <ServiceWorkerRegistrar />

      {/* Demo sidebar — simplified */}
      <aside className="hidden lg:block fixed left-0 top-0 h-screen z-50 w-[220px]">
        <div className="absolute inset-0 backdrop-blur-3xl border-r border-white/20" style={{ background: "var(--sidebar-bg)" }} />
        <div className="relative flex flex-col h-full px-3 py-5">
          {/* Brand */}
          <div className="flex items-center gap-3 px-2.5 mb-6">
            <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs">PD</span>
            </div>
            <div>
              <span className="text-sm font-semibold text-foreground block leading-tight">Dashboard</span>
              <span className="text-[10px] text-fg-tertiary">Demo-läge</span>
            </div>
          </div>

          {/* Demo badge */}
          <div className="mx-2 mb-4 px-3 py-2 rounded-xl bg-accent/10 border border-accent/20">
            <div className="flex items-center gap-1.5 mb-1">
              <Info size={12} className="text-accent" />
              <span className="text-[10px] font-semibold text-accent uppercase tracking-wider">Demo</span>
            </div>
            <p className="text-[10px] text-fg-secondary leading-relaxed">
              Utforska dashboarden utan konto. Skapa ett konto för full tillgång.
            </p>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-1 px-1">
            {[
              { icon: LayoutDashboard, label: "Dashboard", active: true },
              { icon: Clock, label: "Klocka" },
              { icon: CloudSun, label: "Väder" },
              { icon: Timer, label: "Pomodoro" },
              { icon: CalendarDays, label: "Kalender" },
              { icon: ListTodo, label: "Uppgifter" },
            ].map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[13px] ${
                  item.active ? "bg-accent-subtle text-accent font-medium" : "text-fg-secondary"
                }`}
              >
                <item.icon size={16} className={item.active ? "text-accent" : "text-fg-tertiary"} />
                <span>{item.label}</span>
              </div>
            ))}

            <div className="h-px bg-separator my-3" />

            {/* Greyed out items — hint at more features */}
            {[
              { icon: Target, label: "Vanor" },
              { icon: Train, label: "Reseplanerare" },
              { icon: Trophy, label: "NFL / NBA" },
              { icon: Sparkles, label: "AI Assistent" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[13px] text-fg-tertiary/40">
                <item.icon size={16} />
                <span>{item.label}</span>
                <span className="ml-auto text-[8px] bg-separator px-1.5 py-0.5 rounded-full">Pro</span>
              </div>
            ))}
          </nav>

          {/* Login CTA */}
          <div className="px-2 pt-3 border-t border-separator">
            <Link
              href="/register"
              className="w-full flex items-center justify-center gap-2 btn-primary !py-2.5 !rounded-xl text-sm"
            >
              <LogIn size={14} /> Skapa konto
            </Link>
            <Link href="/login" className="block text-center text-[10px] text-fg-tertiary mt-2 hover:text-accent transition-colors">
              Har redan konto? Logga in
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 px-4 py-2.5 flex items-center justify-between border-b border-white/5" style={{ background: "var(--sidebar-bg)", backdropFilter: "blur(24px)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-[10px]">PD</span>
          </div>
          <div>
            <span className="text-sm font-semibold text-foreground block leading-tight">Dashboard</span>
            <span className="text-[9px] text-fg-tertiary">Demo</span>
          </div>
        </div>
        <Link href="/register" className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-accent to-accent-secondary shadow-[0_2px_10px_rgba(46,148,190,0.25)] hover:shadow-[0_4px_15px_rgba(46,148,190,0.35)] transition-all active:scale-95">
          Skapa konto
        </Link>
      </div>

      {/* Main content */}
      <main className="ml-0 lg:ml-[220px] min-h-screen px-3 pt-16 pb-6 sm:px-5 lg:pt-6 lg:px-7 lg:pb-8">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/login" className="flex items-center gap-1.5 text-xs text-fg-tertiary hover:text-accent transition-colors">
            <ArrowLeft size={13} /> Tillbaka till inloggning
          </Link>
          <div className="flex items-center gap-1.5">
            {/* Theme picker — mini version */}
            <div className="relative">
              <button
                onClick={() => setShowThemes(!showThemes)}
                className="p-2 rounded-xl bg-white/10 backdrop-blur border border-white/10 text-fg-secondary hover:text-accent transition-all"
              >
                <Palette size={14} />
              </button>
              {showThemes && (
                <div className="absolute right-0 top-full mt-2 p-2 rounded-xl z-50 w-[180px]" style={{ background: "var(--glass-bg)", backdropFilter: "blur(30px)", border: "1px solid var(--glass-border)" }}>
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => { setThemeById(t.id); setShowThemes(false); }}
                      className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <div className="w-5 h-5 rounded shrink-0 border border-white/10" style={{ background: t.bg }} />
                      <span className="text-[10px] text-foreground">{t.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-xl sm:text-3xl font-bold text-foreground tracking-tighter">
            Välkommen till <span className="text-accent">Personal Dashboard</span>
          </h1>
          <p className="text-sm text-fg-secondary mt-2 max-w-lg">
            En modern produktivitets-dashboard byggd med Next.js, TypeScript, Tailwind CSS och Supabase.
            Utforska demo-versionen nedan — skapa ett konto för full tillgång.
          </p>
        </div>

        {/* Tech stack badges */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {["Next.js 16", "TypeScript", "Tailwind CSS", "Supabase", "Framer Motion", "ESPN API", "ResRobot API"].map((tech) => (
            <span key={tech} className="text-[10px] px-2.5 py-1 rounded-full bg-accent/10 text-accent font-medium border border-accent/15">
              {tech}
            </span>
          ))}
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-4 gap-2 mb-6">
          {[
            { label: "35+ Widgets", desc: "Fullt anpassningsbar" },
            { label: "5 Teman", desc: "Gradient glassmorphism" },
            { label: "Team-chatt", desc: "Realtidskommunikation" },
            { label: "Live Sport", desc: "NFL, NBA, College" },
          ].map((f) => (
            <div key={f.label} className="glass !p-3 text-center">
              <p className="text-sm font-bold text-foreground">{f.label}</p>
              <p className="text-[10px] text-fg-tertiary mt-0.5">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Widget grid — 5 widgets */}
        <p className="text-[11px] text-fg-secondary uppercase tracking-[0.04em] font-medium mb-3">Demo widgets</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <div className="h-[280px] [&>.glass]:h-full [&>.glass]:overflow-hidden [&>.glass]:flex [&>.glass]:flex-col [&>div]:h-full">
            <Suspense fallback={<WidgetSkeleton />}><ClockWidget /></Suspense>
          </div>
          <div className="h-[280px] [&>.glass]:h-full [&>.glass]:overflow-hidden [&>.glass]:flex [&>.glass]:flex-col [&>div]:h-full">
            <Suspense fallback={<WidgetSkeleton />}><WeatherWidget /></Suspense>
          </div>
          <div className="h-[280px] [&>.glass]:h-full [&>.glass]:overflow-hidden [&>.glass]:flex [&>.glass]:flex-col [&>div]:h-full">
            <Suspense fallback={<WidgetSkeleton />}><PomodoroWidget /></Suspense>
          </div>
          <div className="h-[500px] sm:h-[576px] sm:row-span-2 [&>.glass]:h-full [&>.glass]:overflow-hidden [&>.glass]:flex [&>.glass]:flex-col [&>div]:h-full">
            <Suspense fallback={<WidgetSkeleton />}><CalendarWidget /></Suspense>
          </div>
          <div className="h-[280px] [&>.glass]:h-full [&>.glass]:overflow-hidden [&>.glass]:flex [&>.glass]:flex-col [&>div]:h-full">
            <Suspense fallback={<WidgetSkeleton />}><NotesWidget /></Suspense>
          </div>
        </div>

        {/* CTA at bottom */}
        <div className="glass p-6 sm:p-8 mt-8 text-center">
          <h2 className="text-lg font-bold text-foreground mb-2">Gillar du vad du ser?</h2>
          <p className="text-sm text-fg-secondary mb-5 max-w-md mx-auto">
            Skapa ett gratis konto för att få tillgång till alla 35+ widgets, teams, AI-assistent,
            sporttracker, reseplanerare och mycket mer.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register" className="btn-primary !py-3 !px-8 !rounded-xl text-sm flex items-center gap-2">
              <LogIn size={15} /> Skapa gratis konto
            </Link>
            <Link href="/login" className="text-sm text-fg-tertiary hover:text-accent transition-colors">
              Redan medlem? Logga in →
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-xs text-fg-tertiary">
          Byggt av Ludvig Persson &middot; Next.js &middot; TypeScript &middot; Tailwind CSS &middot; Supabase
        </footer>
      </main>
    </div>
  );
}

export default function DemoPage() {
  return (
    <ThemeProvider defaultTheme="emerald-chrome">
      <DemoContent />
    </ThemeProvider>
  );
}

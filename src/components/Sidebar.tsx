"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import {
  LayoutDashboard, CalendarDays, Link2, ListTodo, GitBranch, Target,
  Timer, Music, FileText, Menu, X, Users, User, LogOut, BarChart3,
  ChevronLeft, ChevronRight, Columns3, Grid3X3, CloudSun, Train,
  Trophy, Film, UtensilsCrossed, CalendarClock, Clock, StickyNote,
  Settings2, Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps { userName?: string; }

interface NavItem { href: string; label: string; icon: React.ComponentType<{ size?: number; className?: string }>; alwaysShow?: boolean; }

const ALL_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, alwaysShow: true },
  { href: "/pomodoro", label: "Pomodoro", icon: Timer },
  { href: "/calendar", label: "Kalender", icon: CalendarDays },
  { href: "/todos", label: "Uppgifter", icon: ListTodo },
  { href: "/kanban", label: "Kanban", icon: Columns3 },
  { href: "/notes", label: "Anteckningar", icon: FileText },
  { href: "/habits", label: "Vanor", icon: Target },
  { href: "/github", label: "GitHub", icon: GitBranch },
  { href: "/music", label: "Musik", icon: Music },
  { href: "/links", label: "Snabblänkar", icon: Link2 },
  { href: "/transport", label: "Reseplanerare", icon: Train },
  { href: "/nfl", label: "NFL", icon: Trophy },
  { href: "/nba", label: "NBA", icon: Trophy },
  { href: "/cfb", label: "College Football", icon: Trophy },
  { href: "/sports", label: "Sportkalender", icon: CalendarDays },
  { href: "/meals", label: "Måltider", icon: UtensilsCrossed },
  { href: "/movies", label: "Film & Serier", icon: Film },
  { href: "/countdown", label: "Nedräkning", icon: CalendarClock },
  { href: "/timetrack", label: "Tidrapport", icon: Clock },
  { href: "/goals", label: "Mål", icon: Target },
  { href: "/analytics", label: "Statistik", icon: BarChart3 },
  { href: "/widgets", label: "Widgets", icon: Grid3X3, alwaysShow: true },
  { href: "/teams", label: "Teams", icon: Users, alwaysShow: true },
];

const DEFAULT_VISIBLE = ["/dashboard", "/pomodoro", "/calendar", "/todos", "/notes", "/habits", "/transport", "/analytics", "/widgets", "/teams"];
const SIDEBAR_LS_KEY = "dashboard-sidebar-items";

interface BrandData {
  text: string;
  subtitle: string;
}

const BRAND_DEFAULTS: BrandData = { text: "PD", subtitle: "Personal workspace" };

function useBrand(): BrandData {
  const [brand, setBrand] = useState<BrandData>(BRAND_DEFAULTS);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("dashboard-brand");
      if (raw) {
        const parsed = JSON.parse(raw);
        setBrand({ text: parsed.text || BRAND_DEFAULTS.text, subtitle: parsed.subtitle || BRAND_DEFAULTS.subtitle });
      }
    } catch {}
  }, []);
  return brand;
}

export default function Sidebar({ userName }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [editingNav, setEditingNav] = useState(false);
  const [visibleHrefs, setVisibleHrefs] = useState<string[]>(DEFAULT_VISIBLE);
  const pathname = usePathname();
  const router = useRouter();
  const brand = useBrand();

  useEffect(() => {
    try { const s = localStorage.getItem(SIDEBAR_LS_KEY); if (s) setVisibleHrefs(JSON.parse(s)); } catch {}
  }, []);

  function toggleNavItem(href: string) {
    const item = ALL_NAV_ITEMS.find(i => i.href === href);
    if (item?.alwaysShow) return;
    const updated = visibleHrefs.includes(href) ? visibleHrefs.filter(h => h !== href) : [...visibleHrefs, href];
    setVisibleHrefs(updated);
    localStorage.setItem(SIDEBAR_LS_KEY, JSON.stringify(updated));
  }

  const navItems = ALL_NAV_ITEMS.filter(i => i.alwaysShow || visibleHrefs.includes(i.href));

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const navContent = (showLabels: boolean) => (
    <>
      <nav className="flex-1 space-y-1 overflow-y-auto px-2">
        {editingNav ? (
          // Edit mode — show ALL items with toggles
          ALL_NAV_ITEMS.map((item) => {
            const isOn = item.alwaysShow || visibleHrefs.includes(item.href);
            return (
              <button
                key={item.href}
                onClick={() => toggleNavItem(item.href)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl transition-all text-[12px] ${
                  isOn ? "text-foreground" : "text-fg-tertiary/50"
                } ${item.alwaysShow ? "opacity-50 cursor-default" : "hover:bg-separator/50"}`}
              >
                <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${isOn ? "bg-accent border-accent" : "border-fg-tertiary/30"}`}>
                  {isOn && <Check size={9} className="text-white" strokeWidth={3} />}
                </div>
                <item.icon size={14} className="shrink-0" />
                {showLabels && <span className="truncate">{item.label}</span>}
              </button>
            );
          })
        ) : (
          // Normal mode — show only visible items
          navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`relative flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all text-[13px] group ${
                  isActive ? "text-accent font-medium" : "text-fg-secondary hover:text-foreground"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-accent-subtle"
                    style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)" }}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <item.icon size={16} className={`relative shrink-0 transition-colors ${isActive ? "text-accent" : "text-fg-tertiary group-hover:text-accent/60"}`} />
                {showLabels && <span className="relative truncate">{item.label}</span>}
              </Link>
            );
          })
        )}
      </nav>

      {/* Edit sidebar button */}
      {showLabels && (
        <div className="px-2 pb-1">
          <button
            onClick={() => setEditingNav(!editingNav)}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-[11px] transition-all ${
              editingNav ? "bg-accent text-white" : "text-fg-tertiary hover:text-fg-secondary hover:bg-separator/50"
            }`}
          >
            <Settings2 size={13} />
            <span>{editingNav ? "Klar" : "Redigera meny"}</span>
          </button>
        </div>
      )}
    </>
  );

  const bottomContent = (showLabels: boolean) => (
    <div className="pt-2 mt-2 border-t border-separator/50 space-y-0.5 px-2">
      <Link
        href="/profile"
        onClick={() => setMobileOpen(false)}
        className={`relative flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all text-[13px] ${
          pathname === "/profile" ? "bg-accent-subtle text-accent font-medium" : "text-fg-secondary hover:text-foreground"
        }`}
      >
        <div className="avatar-ring">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent/20 to-accent-secondary/20 flex items-center justify-center">
            <User size={13} className="text-accent" />
          </div>
        </div>
        {showLabels && <span className="truncate">{userName || "Profil"}</span>}
      </Link>
      <button
        onClick={handleSignOut}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[13px] text-fg-tertiary hover:text-accent-warm hover:bg-accent-warm/5 transition-all"
      >
        <LogOut size={16} className="shrink-0" />
        {showLabels && <span>Logga ut</span>}
      </button>
    </div>
  );

  const sidebarWidth = collapsed ? "w-[60px]" : "w-[230px]";

  return (
    <>
      {/* Mobile toggle */}
      <button onClick={() => setMobileOpen(true)} className="lg:hidden fixed top-3 left-3 z-[60] p-2.5 rounded-xl bg-white/30 backdrop-blur-xl border border-white/30 shadow-sm text-fg-secondary min-w-[44px] min-h-[44px] flex items-center justify-center">
        <Menu size={18} />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-[55] bg-black/20 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="lg:hidden fixed left-0 top-0 h-screen z-[60] w-[260px]"
          >
            <div className="absolute inset-0 bg-white/40 backdrop-blur-3xl border-r border-white/30" />
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-3 btn-ghost p-1.5 z-10"><X size={16} /></button>
            <div className="relative h-full flex flex-col py-5">
              <div className="flex items-center gap-3 px-5 mb-6">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2e94be] via-[#4cb4d8] to-[#6aafc8] flex items-center justify-center shadow-[0_2px_10px_rgba(46,148,190,0.2)]">
                  <span className="text-white font-bold text-xs">{brand.text}</span>
                </div>
                <div>
                  <span className="text-sm font-semibold text-foreground block leading-tight">Dashboard</span>
                  <span className="text-[10px] text-fg-tertiary">{brand.subtitle}</span>
                </div>
              </div>
              {navContent(true)}
              {bottomContent(true)}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 60 : 230 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`hidden lg:block fixed left-0 top-0 h-screen z-50`}
      >
        <div className="absolute inset-0 backdrop-blur-3xl border-r border-white/20" style={{ background: "var(--sidebar-bg)" }} />
        <div className="relative h-full flex flex-col py-5">
          {/* Brand */}
          <div className={`flex items-center gap-3 mb-6 ${collapsed ? "px-3 justify-center" : "px-5"}`}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2e94be] via-[#4cb4d8] to-[#6aafc8] flex items-center justify-center shrink-0 shadow-[0_2px_10px_rgba(46,148,190,0.2)]">
              <span className="text-white font-bold text-xs">{brand.text}</span>
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <span className="text-sm font-semibold text-foreground block leading-tight whitespace-nowrap">Dashboard</span>
                  <span className="text-[10px] text-fg-tertiary whitespace-nowrap">{brand.subtitle}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {navContent(!collapsed)}
          {bottomContent(!collapsed)}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-surface-elevated border border-separator flex items-center justify-center text-fg-tertiary hover:text-accent shadow-sm transition-colors"
        >
          {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
        </button>
      </motion.aside>

      {/* CSS variable for main content margin */}
      <style>{`
        @media (min-width: 1024px) {
          main { margin-left: ${collapsed ? "60px" : "230px"} !important; }
        }
        @media (max-width: 1023px) {
          main { margin-left: 0 !important; }
        }
      `}</style>
    </>
  );
}

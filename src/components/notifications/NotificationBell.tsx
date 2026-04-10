"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Bell,
  Calendar,
  Timer,
  Flame,
  Users,
  Check,
  X,
} from "lucide-react";

interface Notification {
  id: string;
  type: "reminder" | "pomodoro" | "habit-streak" | "team-invite";
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
}

interface Reminder {
  id: string;
  title: string;
  date: string;
  time: string;
  color: string;
}

const ICON_MAP: Record<Notification["type"], typeof Calendar> = {
  reminder: Calendar,
  pomodoro: Timer,
  "habit-streak": Flame,
  "team-invite": Users,
};

const COLOR_MAP: Record<Notification["type"], string> = {
  reminder: "#0e88b0",
  pomodoro: "#da77f2",
  "habit-streak": "#69db7c",
  "team-invite": "#ffa94d",
};

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just nu";
  if (minutes < 60) return `${minutes} min sedan`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h sedan`;
  const days = Math.floor(hours / 24);
  return `${days}d sedan`;
}

function loadNotifications(): Notification[] {
  try {
    const saved = localStorage.getItem("dashboard-notifications");
    if (saved) return JSON.parse(saved);
  } catch {
    /* */
  }
  return [];
}

function saveNotifications(notifications: Notification[]) {
  localStorage.setItem(
    "dashboard-notifications",
    JSON.stringify(notifications)
  );
}

function addNotificationIfNew(
  existing: Notification[],
  notification: Omit<Notification, "read">
): Notification[] {
  if (existing.some((n) => n.id === notification.id)) return existing;
  return [{ ...notification, read: false }, ...existing];
}

export default function NotificationBell() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const generateAutoNotifications = useCallback(() => {
    let updated = loadNotifications();

    // Check upcoming reminders (within 1 hour)
    try {
      const saved = localStorage.getItem("dashboard-reminders");
      if (saved) {
        const reminders: Reminder[] = JSON.parse(saved);
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;

        for (const r of reminders) {
          const reminderTime = new Date(`${r.date}T${r.time}`).getTime();
          if (reminderTime > now && reminderTime - now <= oneHour) {
            updated = addNotificationIfNew(updated, {
              id: `reminder-${r.id}`,
              type: "reminder",
              title: "Kommande påminnelse",
              description: `${r.title} kl ${r.time}`,
              timestamp: new Date().toISOString(),
            });
          }
        }
      }
    } catch {
      /* */
    }

    // Check pomodoro milestones
    try {
      const count = parseInt(
        localStorage.getItem("pomodoro-count") || "0",
        10
      );
      const milestones = [5, 10, 25, 50, 100];
      for (const m of milestones) {
        if (count >= m) {
          updated = addNotificationIfNew(updated, {
            id: `pomodoro-milestone-${m}`,
            type: "pomodoro",
            title: "Pomodoro-milstolpe!",
            description: `Du har slutfört ${m} pomodoro-sessioner!`,
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch {
      /* */
    }

    saveNotifications(updated);
    setNotifications(updated);
  }, []);

  useEffect(() => {
    setMounted(true);
    generateAutoNotifications();

    // Re-check every 5 minutes
    const interval = setInterval(generateAutoNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [generateAutoNotifications]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  function markAllRead() {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    saveNotifications(updated);
  }

  function dismissNotification(id: string) {
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    saveNotifications(updated);
  }

  if (!mounted) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-ghost relative p-2 rounded-xl transition-colors"
        aria-label="Notifikationer"
      >
        <Bell size={18} className="text-fg-secondary" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-accent text-[9px] font-bold text-white leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-[420px] flex flex-col bg-white/15 backdrop-blur-3xl border border-white/25 rounded-2xl shadow-2xl overflow-hidden z-[200]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h3 className="text-sm font-semibold text-foreground">
              Notifikationer
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-[11px] text-accent hover:text-accent/80 transition-colors"
              >
                <Check size={11} />
                Markera alla som lästa
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-fg-tertiary">
                <Bell size={24} className="mb-2 opacity-40" />
                <p className="text-sm">Inga notifikationer</p>
              </div>
            ) : (
              <div className="py-1">
                {notifications.map((n) => {
                  const Icon = ICON_MAP[n.type];
                  const color = COLOR_MAP[n.type];
                  return (
                    <div
                      key={n.id}
                      className={`group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/5 ${
                        !n.read ? "bg-white/5" : ""
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: `${color}20` }}
                      >
                        <Icon size={14} style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className={`text-xs font-medium truncate ${
                              !n.read
                                ? "text-foreground"
                                : "text-fg-secondary"
                            }`}
                          >
                            {n.title}
                          </p>
                          {!n.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-fg-tertiary mt-0.5 leading-snug">
                          {n.description}
                        </p>
                        <p className="text-[10px] text-fg-tertiary/60 mt-1">
                          {timeAgo(n.timestamp)}
                        </p>
                      </div>
                      <button
                        onClick={() => dismissNotification(n.id)}
                        className="opacity-0 group-hover:opacity-100 btn-ghost p-1 rounded-lg text-fg-tertiary hover:text-accent-warm transition-all shrink-0"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

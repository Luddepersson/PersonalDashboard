"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday } from "date-fns";
import { sv } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, X, Clock, Bell, Calendar } from "lucide-react";

interface Reminder { id: string; title: string; date: string; time: string; color: string; notified?: boolean; }
const COLORS = ["#0e88b0", "#e07a5f", "#69db7c", "#da77f2", "#ffa94d", "#d4b896"];

function playNotificationSound() {
  try {
    const ctx = new AudioContext();
    [0, 0.15].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = i === 0 ? 880 : 1100;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.15, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.8);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.8);
    });
  } catch {}
}

export default function CalendarPage() {
  const [mounted, setMounted] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [newReminder, setNewReminder] = useState({ title: "", time: "09:00", color: COLORS[0] });

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("dashboard-reminders");
    if (saved) { try { setReminders(JSON.parse(saved)); } catch {} }
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    function checkReminders() {
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      const currentTime = format(now, "HH:mm");
      let changed = false;
      const updated = reminders.map((r) => {
        if (r.date === todayStr && r.time === currentTime && !r.notified) {
          playNotificationSound();
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification("Paminnelse", { body: `${r.time} -- ${r.title}` });
          }
          changed = true;
          return { ...r, notified: true };
        }
        return r;
      });
      if (changed) { setReminders(updated); localStorage.setItem("dashboard-reminders", JSON.stringify(updated)); }
    }
    checkReminders();
    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [mounted, reminders]);

  function saveReminders(updated: Reminder[]) {
    setReminders(updated);
    localStorage.setItem("dashboard-reminders", JSON.stringify(updated));
  }

  function addReminder() {
    if (!newReminder.title.trim()) return;
    saveReminders([...reminders, {
      id: Date.now().toString(),
      title: newReminder.title.trim(),
      date: format(selectedDate, "yyyy-MM-dd"),
      time: newReminder.time,
      color: newReminder.color,
      notified: false,
    }]);
    setNewReminder({ title: "", time: "09:00", color: COLORS[0] });
  }

  if (!mounted) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="h-8 w-48 rounded bg-separator animate-pulse" />
          <div className="h-4 w-64 rounded bg-separator animate-pulse mt-3" />
        </div>
        <div className="h-96 rounded-xl bg-separator animate-pulse" />
      </div>
    );
  }

  const monthStart = startOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 });
  const days: Date[] = [];
  let d = calStart;
  while (d <= calEnd) { days.push(d); d = addDays(d, 1); }

  const selStr = format(selectedDate, "yyyy-MM-dd");
  const selReminders = reminders.filter((r) => r.date === selStr).sort((a, b) => a.time.localeCompare(b.time));

  const reminderMap: Record<string, { count: number; colors: string[] }> = {};
  reminders.forEach((r) => {
    if (!reminderMap[r.date]) reminderMap[r.date] = { count: 0, colors: [] };
    reminderMap[r.date].count++;
    if (!reminderMap[r.date].colors.includes(r.color)) reminderMap[r.date].colors.push(r.color);
  });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tighter">Kalender</h1>
        <p className="text-sm text-fg-secondary mt-1.5">Hall koll pa dina datum och handelser</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid -- takes 2/3 */}
        <div className="lg:col-span-2 glass p-6 sm:p-8">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: sv })}
            </h2>
            <div className="flex gap-2">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="btn-ghost p-2 rounded-lg">
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => { setCurrentMonth(new Date()); setSelectedDate(new Date()); }}
                className="btn-ghost px-3 py-1.5 rounded-lg text-sm text-fg-secondary"
              >
                Idag
              </button>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="btn-ghost p-2 rounded-lg">
                <ChevronRight size={20} />
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

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => {
              const inMonth = isSameMonth(day, monthStart);
              const selected = isSameDay(day, selectedDate);
              const todayDate = isToday(day);
              const dateStr = format(day, "yyyy-MM-dd");
              const dayReminders = reminderMap[dateStr];

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(day)}
                  className={`relative min-h-[48px] sm:min-h-[56px] p-1.5 rounded-lg transition-all text-center text-sm
                    ${!inMonth ? "text-fg-tertiary/20" : "text-fg-secondary hover:bg-separator"}
                    ${selected ? "bg-accent text-white font-semibold ring-2 ring-accent/30" : ""}
                    ${todayDate && !selected ? "text-accent font-bold" : ""}
                    ${dayReminders && !selected ? "bg-accent/8" : ""}
                  `}
                >
                  {format(day, "d")}
                  {dayReminders && !selected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-[3px]">
                      {dayReminders.colors.slice(0, 3).map((c, ci) => (
                        <span key={ci} className="w-[5px] h-[5px] rounded-full" style={{ background: c }} />
                      ))}
                    </span>
                  )}
                  {todayDate && !selected && (
                    <span className="absolute inset-0 rounded-lg border-2 border-accent/30 pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar -- selected day details */}
        <div className="space-y-6">
          {/* Selected date info */}
          <div className="glass p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar size={18} className="text-accent" />
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {format(selectedDate, "d MMMM", { locale: sv })}
                </h3>
                <p className="text-xs text-fg-tertiary capitalize">
                  {format(selectedDate, "EEEE yyyy", { locale: sv })}
                </p>
              </div>
              {selReminders.length > 0 && (
                <span className="ml-auto text-xs px-2.5 py-1 rounded-full bg-accent/15 text-accent font-medium">
                  {selReminders.length} st
                </span>
              )}
            </div>

            {/* Reminders for selected day */}
            <div className="space-y-2 mb-4">
              {selReminders.length === 0 && (
                <p className="text-sm text-fg-tertiary py-4 text-center">Inga paminnelser denna dag</p>
              )}
              {selReminders.map((r) => (
                <div key={r.id} className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-surface/30 group transition-colors hover:bg-surface/50">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: r.color }} />
                  <span className="text-xs text-fg-tertiary font-mono w-12 shrink-0">{r.time}</span>
                  <span className="text-sm text-foreground truncate flex-1">{r.title}</span>
                  {r.notified && <Bell size={12} className="text-accent/40 shrink-0" />}
                  <button
                    onClick={() => saveReminders(reminders.filter((x) => x.id !== r.id))}
                    className="opacity-0 group-hover:opacity-100 text-fg-tertiary hover:text-accent-warm transition-opacity shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add Reminder Form -- always visible */}
          <div className="glass p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Ny paminnelse</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Vad ska du bli pamind om?"
                value={newReminder.title}
                onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && addReminder()}
                className="input-base w-full"
              />
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 input-base !py-2 !px-3">
                  <Clock size={14} className="text-fg-tertiary" />
                  <input
                    type="time"
                    value={newReminder.time}
                    onChange={(e) => setNewReminder({ ...newReminder, time: e.target.value })}
                    className="bg-transparent text-sm text-foreground focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewReminder({ ...newReminder, color: c })}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      newReminder.color === c ? "scale-110 ring-2 ring-offset-2 ring-accent/30" : ""
                    }`}
                    style={{ background: c }}
                  />
                ))}
              </div>
              <button onClick={addReminder} className="btn-primary w-full !py-2.5 flex items-center justify-center gap-2">
                <Bell size={14} /> Lagg till paminnelse
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

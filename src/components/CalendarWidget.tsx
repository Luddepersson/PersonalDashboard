"use client";

import { useState, useEffect, useCallback } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday } from "date-fns";
import { sv } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, X, Clock, Bell } from "lucide-react";
import GlassCard from "./GlassCard";

interface Reminder { id: string; title: string; date: string; time: string; color: string; notified?: boolean; }
const COLORS = ["#0e88b0", "#e07a5f", "#69db7c", "#da77f2", "#ffa94d", "#d4b896"];

function playNotificationSound() {
  try {
    const ctx = new AudioContext();
    // Pleasant chime: two notes
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
  } catch { /* audio not available */ }
}

export default function CalendarWidget() {
  const [mounted, setMounted] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newReminder, setNewReminder] = useState({ title: "", time: "09:00", color: COLORS[0] });

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("dashboard-reminders");
    if (saved) { try { setReminders(JSON.parse(saved)); } catch {} }

    // Request notification permission
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Check for due reminders every 30 seconds
  useEffect(() => {
    if (!mounted) return;

    function checkReminders() {
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      const currentTime = format(now, "HH:mm");
      let changed = false;

      const updated = reminders.map((r) => {
        if (r.date === todayStr && r.time === currentTime && !r.notified) {
          // Fire notification
          playNotificationSound();
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification("Påminnelse", { body: `${r.time} — ${r.title}`, icon: "/icon-192.png" });
          }
          changed = true;
          return { ...r, notified: true };
        }
        return r;
      });

      if (changed) {
        setReminders(updated);
        localStorage.setItem("dashboard-reminders", JSON.stringify(updated));
      }
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
    setShowAdd(false);
  }

  if (!mounted) return <GlassCard className="flex items-center justify-center"><div className="h-32 w-full rounded bg-separator animate-pulse" /></GlassCard>;

  const monthStart = startOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 });
  const days: Date[] = [];
  let d = calStart;
  while (d <= calEnd) { days.push(d); d = addDays(d, 1); }

  const selStr = format(selectedDate, "yyyy-MM-dd");
  const selReminders = reminders.filter((r) => r.date === selStr).sort((a, b) => a.time.localeCompare(b.time));

  // Build a map of dates → reminder count + colors for visual markers
  const reminderMap: Record<string, { count: number; colors: string[] }> = {};
  reminders.forEach((r) => {
    if (!reminderMap[r.date]) reminderMap[r.date] = { count: 0, colors: [] };
    reminderMap[r.date].count++;
    if (!reminderMap[r.date].colors.includes(r.color)) reminderMap[r.date].colors.push(r.color);
  });

  return (
    <GlassCard className="flex flex-col" hover3d={false}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground capitalize">{format(currentMonth, "MMMM yyyy", { locale: sv })}</h3>
        <div className="flex gap-1">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="btn-ghost !p-1.5 rounded-lg"><ChevronLeft size={16} /></button>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="btn-ghost !p-1.5 rounded-lg"><ChevronRight size={16} /></button>
        </div>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 mb-2">
        {["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"].map((day) => (
          <div key={day} className="text-center text-[11px] text-fg-tertiary font-medium">{day}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-1 flex-1">
        {days.map((day, i) => {
          const inMonth = isSameMonth(day, monthStart);
          const selected = isSameDay(day, selectedDate);
          const todayDate = isToday(day);
          const dateStr = format(day, "yyyy-MM-dd");
          const dayReminders = reminderMap[dateStr];

          return (
            <button key={i} onClick={() => setSelectedDate(day)}
              className={`relative text-sm py-1.5 rounded-lg transition-all text-center
                ${!inMonth ? "text-fg-tertiary/20" : "text-fg-secondary hover:bg-separator"}
                ${selected ? "bg-accent text-white font-semibold" : ""}
                ${todayDate && !selected ? "text-accent font-bold" : ""}
                ${dayReminders && !selected ? "bg-accent/8" : ""}
              `}>
              {format(day, "d")}

              {/* Reminder dots — show colored dots under the date */}
              {dayReminders && !selected && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-[2px]">
                  {dayReminders.colors.slice(0, 3).map((c, ci) => (
                    <span key={ci} className="w-[4px] h-[4px] rounded-full" style={{ background: c }} />
                  ))}
                </span>
              )}

              {/* Today ring */}
              {todayDate && !selected && (
                <span className="absolute inset-0 rounded-lg border-2 border-accent/30 pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom — selected date reminders */}
      <div className="pt-3 border-t border-separator mt-3 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <p className="text-xs text-fg-secondary font-medium">{format(selectedDate, "d MMMM", { locale: sv })}</p>
            {selReminders.length > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent/15 text-accent font-medium">
                {selReminders.length}
              </span>
            )}
          </div>
          <button onClick={() => setShowAdd(!showAdd)} className="btn-ghost !p-1 rounded-lg flex items-center gap-1 text-[10px] text-fg-tertiary">
            {showAdd ? <X size={12} /> : <><Plus size={12} /> Påminnelse</>}
          </button>
        </div>

        {/* Add reminder form */}
        {showAdd && (
          <div className="mb-2 p-3 rounded-xl bg-surface/30 space-y-2">
            <input
              type="text"
              placeholder="Vad ska du bli påmind om?"
              value={newReminder.title}
              onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && addReminder()}
              className="input-base w-full !text-xs"
              autoFocus
            />
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 input-base !py-1.5 !px-2.5">
                <Clock size={12} className="text-fg-tertiary" />
                <input
                  type="time"
                  value={newReminder.time}
                  onChange={(e) => setNewReminder({ ...newReminder, time: e.target.value })}
                  className="bg-transparent text-xs text-foreground focus:outline-none"
                />
              </div>
              <div className="flex gap-1.5">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewReminder({ ...newReminder, color: c })}
                    className={`w-5 h-5 rounded-full transition-transform ${newReminder.color === c ? "scale-110 ring-2 ring-offset-1 ring-accent/30" : ""}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
              <button onClick={addReminder} className="btn-primary !py-1.5 !px-3 !text-xs ml-auto flex items-center gap-1">
                <Bell size={11} /> Spara
              </button>
            </div>
          </div>
        )}

        {/* Reminders list */}
        <div className="space-y-1 max-h-[100px] overflow-y-auto">
          {selReminders.length === 0 && !showAdd && <p className="text-xs text-fg-tertiary">Inga påminnelser denna dag</p>}
          {selReminders.map((r) => (
            <div key={r.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-surface/30 group transition-colors">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: r.color }} />
              <span className="text-[11px] text-fg-tertiary font-mono w-10 shrink-0">{r.time}</span>
              <span className="text-xs text-foreground truncate flex-1">{r.title}</span>
              {r.notified && <Bell size={10} className="text-accent/40 shrink-0" />}
              <button
                onClick={() => saveReminders(reminders.filter((x) => x.id !== r.id))}
                className="opacity-0 group-hover:opacity-100 text-fg-tertiary hover:text-accent-warm transition-opacity shrink-0"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

"use client";
import TimeTrackWidget from "@/components/timetrack/TimeTrackWidget";

export default function TimeTrackPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tighter">Tidrapport</h1>
        <p className="text-sm text-fg-secondary mt-1.5">Logga arbetstid per projekt</p>
      </div>
      <TimeTrackWidget />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import GlassCard from "./GlassCard";

export default function ClockWidget() {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return <GlassCard className="flex items-center justify-center"><div className="h-10 w-36 rounded-xl bg-surface animate-pulse" /></GlassCard>;

  return (
    <GlassCard className="flex flex-col items-center justify-center relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full bg-accent/5 blur-3xl pointer-events-none" />
      <div className="relative flex items-baseline gap-0.5 font-mono">
        <span className="text-[3.2rem] font-light text-foreground tracking-tighter leading-none">{format(now, "HH")}</span>
        <span className="text-[2.8rem] font-light text-accent/50 animate-pulse mx-0.5">:</span>
        <span className="text-[3.2rem] font-light text-foreground tracking-tighter leading-none">{format(now, "mm")}</span>
        <span className="text-base text-fg-tertiary ml-1.5 font-normal">{format(now, "ss")}</span>
      </div>
      <p className="mt-3 text-xs text-fg-tertiary capitalize tracking-wide">
        {format(now, "EEEE, d MMMM", { locale: sv })}
      </p>
    </GlassCard>
  );
}

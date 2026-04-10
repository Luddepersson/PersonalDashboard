"use client";

import { useState, useEffect } from "react";

function getGreeting(hour: number): string {
  if (hour < 5) return "God natt";
  if (hour < 12) return "God morgon";
  if (hour < 17) return "God eftermiddag";
  return "God kväll";
}

export default function GreetingHeader() {
  const [mounted, setMounted] = useState(false);
  const [greeting, setGreeting] = useState("Välkommen");

  useEffect(() => {
    setGreeting(getGreeting(new Date().getHours()));
    setMounted(true);
  }, []);

  return (
    <div>
      <h1 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight">
        {mounted ? greeting : "Välkommen"}
      </h1>
      <p className="text-fg-secondary text-sm mt-0.5">Här är din översikt</p>
    </div>
  );
}

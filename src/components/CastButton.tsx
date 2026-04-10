"use client";

import { useState, useEffect, useRef } from "react";
import { Cast, X, Tv } from "lucide-react";

// Cast button supporting both Chromecast (via Presentation API) and AirPlay (via Remote Playback API)
// Falls back to fullscreen + tab capture for sharing

declare global {
  interface Window {
    chrome?: { cast?: unknown };
  }
}

export default function CastButton() {
  const [open, setOpen] = useState(false);
  const [casting, setCasting] = useState(false);
  const [supported, setSupported] = useState({ presentation: false, airplay: false });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check support
    const presentation = typeof window !== "undefined" && "PresentationRequest" in window;
    const airplay = typeof window !== "undefined" && "WebKitPlaybackTargetAvailabilityEvent" in window;
    setSupported({ presentation, airplay });

    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function castChromecast() {
    try {
      // Use Presentation API to send the current page URL to a cast device
      const url = window.location.href;
      if ("PresentationRequest" in window) {
        const PR = (window as unknown as { PresentationRequest: new (urls: string[]) => unknown }).PresentationRequest;
        const request = new PR([url]) as { start: () => Promise<unknown> };
        await request.start();
        setCasting(true);
      } else {
        alert("Chromecast stöds inte i denna webbläsare. Använd Chrome och högerklicka → 'Cast...'");
      }
    } catch (e) {
      console.warn("Cast failed:", e);
      alert("Kunde inte ansluta. I Chrome: tryck på meny (⋮) → Cast...");
    }
    setOpen(false);
  }

  async function castAirplay() {
    try {
      // Try the AirPlay Remote Playback API on a video element
      const video = document.createElement("video");
      if ("webkitShowPlaybackTargetPicker" in video) {
        (video as unknown as { webkitShowPlaybackTargetPicker: () => void }).webkitShowPlaybackTargetPicker();
        setCasting(true);
      } else {
        alert("AirPlay stöds inte i denna webbläsare. Använd Safari och spegla skärmen från Kontrollcenter.");
      }
    } catch (e) {
      console.warn("AirPlay failed:", e);
    }
    setOpen(false);
  }

  async function fullscreenMirror() {
    // Fallback: full-screen the page so it can be screen-mirrored
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setCasting(false);
      } else {
        await document.documentElement.requestFullscreen();
        setCasting(true);
      }
    } catch {}
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="focus-ring p-2 rounded-xl bg-white/10 backdrop-blur border border-white/10 text-[var(--foreground-secondary)] hover:text-[var(--accent)] hover:bg-white/15 hover:border-[var(--accent)]/20 transition-all shadow-sm"
        aria-label="Casta sida"
        title="Casta till TV (Chromecast / AirPlay)"
      >
        <Cast size={15} className={casting ? "text-accent" : ""} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-[260px] p-3 rounded-2xl backdrop-blur-3xl border shadow-[0_16px_48px_rgba(0,0,0,0.2)] animate-in z-50"
          style={{ background: "var(--glass-bg)", borderColor: "var(--glass-border)" }}
        >
          <p className="text-xs font-semibold mb-2.5 px-1 text-foreground">Casta dashboard</p>
          <div className="space-y-1.5">
            <button
              onClick={castChromecast}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-all text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#4285F4] to-[#34A853] flex items-center justify-center shrink-0">
                <Cast size={16} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground">Chromecast</p>
                <p className="text-[10px] text-fg-tertiary">Casta via Google Chrome</p>
              </div>
            </button>

            <button
              onClick={castAirplay}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-all text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#1d1d1f] to-[#2c2c2e] flex items-center justify-center shrink-0 border border-white/10">
                <Tv size={16} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground">AirPlay</p>
                <p className="text-[10px] text-fg-tertiary">Casta via Safari till Apple TV</p>
              </div>
            </button>

            <button
              onClick={fullscreenMirror}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-all text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                <X size={16} className="text-accent" style={{ transform: "rotate(45deg)" }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground">Fullskärm</p>
                <p className="text-[10px] text-fg-tertiary">För skärmspegling</p>
              </div>
            </button>
          </div>

          <div className="mt-3 pt-2 border-t border-separator">
            <p className="text-[10px] text-fg-tertiary leading-relaxed">
              💡 <strong>Tips:</strong> I Chrome kan du också högerklicka → &quot;Casta...&quot; för att spegla hela fliken.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

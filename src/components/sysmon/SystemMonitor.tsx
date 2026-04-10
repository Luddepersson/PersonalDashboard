"use client";

import { useState, useEffect } from "react";
import GlassCard from "../GlassCard";
import { Battery, Wifi, WifiOff, Monitor, Cpu } from "lucide-react";

interface SysInfo {
  battery: number | null;
  charging: boolean;
  online: boolean;
  screenW: number;
  screenH: number;
  memory: number | null;
  cores: number;
  platform: string;
  language: string;
}

export default function SystemMonitor() {
  const [mounted, setMounted] = useState(false);
  const [info, setInfo] = useState<SysInfo | null>(null);

  useEffect(() => {
    setMounted(true);

    const update = async () => {
      let battery: number | null = null;
      let charging = false;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const bm = await (navigator as any).getBattery?.();
        if (bm) { battery = Math.round(bm.level * 100); charging = bm.charging; }
      } catch { /* not available */ }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const perf = (performance as any);
      const memory = perf?.memory ? Math.round(perf.memory.usedJSHeapSize / 1048576) : null;

      setInfo({
        battery,
        charging,
        online: navigator.onLine,
        screenW: window.screen.width,
        screenH: window.screen.height,
        memory,
        cores: navigator.hardwareConcurrency || 0,
        platform: navigator.platform || "Okänd",
        language: navigator.language || "—",
      });
    };

    update();
    const interval = setInterval(update, 10000);

    const onOnline = () => setInfo((p) => p ? { ...p, online: true } : p);
    const onOffline = () => setInfo((p) => p ? { ...p, online: false } : p);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (!mounted || !info) return <GlassCard className="h-[280px]"><div /></GlassCard>;

  const batteryColor = info.battery === null ? "text-fg-tertiary"
    : info.battery > 50 ? "text-green-400"
    : info.battery > 20 ? "text-yellow-400" : "text-red-400";

  return (
    <GlassCard className="h-[280px] flex flex-col p-4">
      <div className="flex items-center gap-2 mb-3">
        <Cpu size={16} className="text-accent" />
        <h3 className="text-foreground font-semibold text-sm">Systemmonitor</h3>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-3 content-start">
        {/* Battery */}
        <div className="flex items-center gap-2">
          <Battery size={16} className={batteryColor} />
          <div>
            <p className="text-fg-tertiary text-[10px]">Batteri</p>
            <p className="text-foreground text-xs font-medium">
              {info.battery !== null ? `${info.battery}%${info.charging ? " ⚡" : ""}` : "Ej tillgängligt"}
            </p>
          </div>
        </div>

        {/* Online */}
        <div className="flex items-center gap-2">
          {info.online ? <Wifi size={16} className="text-green-400" /> : <WifiOff size={16} className="text-red-400" />}
          <div>
            <p className="text-fg-tertiary text-[10px]">Nätverk</p>
            <p className="text-foreground text-xs font-medium flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${info.online ? "bg-green-400" : "bg-red-400"}`} />
              {info.online ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* Screen */}
        <div className="flex items-center gap-2">
          <Monitor size={16} className="text-fg-secondary" />
          <div>
            <p className="text-fg-tertiary text-[10px]">Skärm</p>
            <p className="text-foreground text-xs font-medium">{info.screenW} × {info.screenH}</p>
          </div>
        </div>

        {/* Cores */}
        <div className="flex items-center gap-2">
          <Cpu size={16} className="text-fg-secondary" />
          <div>
            <p className="text-fg-tertiary text-[10px]">CPU-kärnor</p>
            <p className="text-foreground text-xs font-medium">{info.cores || "Okänt"}</p>
          </div>
        </div>

        {/* Memory */}
        <div className="col-span-2 flex items-center gap-2">
          <div className="w-4 h-4 flex items-center justify-center text-fg-secondary text-[10px] font-bold">MB</div>
          <div>
            <p className="text-fg-tertiary text-[10px]">JS-minnesanvändning</p>
            <p className="text-foreground text-xs font-medium">{info.memory !== null ? `${info.memory} MB` : "Ej tillgängligt"}</p>
          </div>
        </div>

        {/* Platform */}
        <div>
          <p className="text-fg-tertiary text-[10px]">Plattform</p>
          <p className="text-foreground text-xs font-medium">{info.platform}</p>
        </div>

        {/* Language */}
        <div>
          <p className="text-fg-tertiary text-[10px]">Språk</p>
          <p className="text-foreground text-xs font-medium">{info.language}</p>
        </div>
      </div>
    </GlassCard>
  );
}

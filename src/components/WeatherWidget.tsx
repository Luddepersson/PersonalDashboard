"use client";

import { useState, useEffect, useRef } from "react";
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, CloudFog, Wind, Droplets, MapPin, Thermometer } from "lucide-react";
import GlassCard from "./GlassCard";

interface WeatherData { temperature: number; weatherCode: number; windSpeed: number; humidity: number; description: string; }

const DESC: Record<number, string> = {
  0: "Klart", 1: "Mestadels klart", 2: "Delvis molnigt", 3: "Molnigt",
  45: "Dimma", 48: "Rimfrost", 51: "Lätt duggregn", 53: "Duggregn", 55: "Kraftigt duggregn",
  61: "Lätt regn", 63: "Regn", 65: "Kraftigt regn", 71: "Lätt snö", 73: "Snö", 75: "Kraftigt snö",
  80: "Regnskurar", 95: "Åskväder",
};

function getIcon(code: number) {
  const s = 36;
  if (code <= 1) return <Sun size={s} className="text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.4)]" />;
  if (code <= 3) return <Cloud size={s} className="text-fg-secondary" />;
  if (code <= 48) return <CloudFog size={s} className="text-fg-tertiary" />;
  if (code <= 55) return <CloudDrizzle size={s} className="text-accent-secondary" />;
  if (code <= 65) return <CloudRain size={s} className="text-accent" />;
  if (code <= 75) return <CloudSnow size={s} className="text-foreground" />;
  if (code <= 82) return <CloudRain size={s} className="text-accent" />;
  return <CloudLightning size={s} className="text-amber-400" />;
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [city, setCity] = useState("Stockholm");
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    async function fetchWeather(lat: number, lon: number) {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&timezone=auto`);
        const data = await res.json();
        if (!mountedRef.current) return;
        const c = data.current;
        setWeather({ temperature: Math.round(c.temperature_2m), weatherCode: c.weather_code, windSpeed: Math.round(c.wind_speed_10m), humidity: c.relative_humidity_2m, description: DESC[c.weather_code] || "Okänt" });
      } catch { /* */ }
      if (mountedRef.current) setLoading(false);
    }
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { if (mountedRef.current) { fetchWeather(pos.coords.latitude, pos.coords.longitude); setCity("Din plats"); } },
        () => { if (mountedRef.current) fetchWeather(59.33, 18.07); }
      );
    } else { fetchWeather(59.33, 18.07); }
    return () => { mountedRef.current = false; };
  }, []);

  if (loading) return <GlassCard className="flex items-center justify-center"><div className="h-8 w-8 rounded-full border-2 border-accent/30 border-t-accent animate-spin" /></GlassCard>;
  if (!weather) return <GlassCard className="flex items-center justify-center"><p className="text-sm text-fg-tertiary">Kunde inte hämta väder</p></GlassCard>;

  return (
    <GlassCard className="flex flex-col justify-between" hover3d={false}>
      {/* Top — location */}
      <div className="flex items-center gap-1.5 mb-3">
        <MapPin size={12} className="text-fg-tertiary" />
        <p className="text-[11px] text-fg-tertiary uppercase tracking-wider">{city}</p>
      </div>

      {/* Center — temperature + icon + description */}
      <div className="flex items-center justify-between flex-1">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-light text-foreground tracking-tight">{weather.temperature}</span>
            <span className="text-xl text-fg-tertiary font-light">°C</span>
          </div>
          <p className="text-sm text-fg-secondary mt-1">{weather.description}</p>
        </div>
        <div className="animate-float">{getIcon(weather.weatherCode)}</div>
      </div>

      {/* Bottom — stats row */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-separator mt-3">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-surface/40">
          <Wind size={14} className="text-accent/60" />
          <div>
            <p className="text-xs font-medium text-foreground">{weather.windSpeed} km/h</p>
            <p className="text-[9px] text-fg-tertiary">Vind</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-surface/40">
          <Droplets size={14} className="text-accent/60" />
          <div>
            <p className="text-xs font-medium text-foreground">{weather.humidity}%</p>
            <p className="text-[9px] text-fg-tertiary">Fuktighet</p>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

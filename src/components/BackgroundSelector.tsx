"use client";

import { useState, useEffect } from "react";
import GlassCard from "@/components/GlassCard";

const STORAGE_KEY = "dashboard-bg-image";

const PRESET_IMAGES = [
  { url: "", label: "Ingen bild" },
  { url: "https://picsum.photos/id/1018/1920/1080", label: "Berg" },
  { url: "https://picsum.photos/id/1015/1920/1080", label: "Flod" },
  { url: "https://picsum.photos/id/1039/1920/1080", label: "Skog" },
  { url: "https://picsum.photos/id/984/1920/1080", label: "Stad" },
  { url: "https://picsum.photos/id/1069/1920/1080", label: "Hav" },
];

export function useBackgroundImage(): string {
  const [url, setUrl] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setUrl(stored);
    } catch {}

    // Listen for changes from BackgroundSelector
    const handler = () => {
      try {
        setUrl(localStorage.getItem(STORAGE_KEY) || "");
      } catch {}
    };
    window.addEventListener("bg-image-change", handler);
    return () => window.removeEventListener("bg-image-change", handler);
  }, []);

  return url;
}

export default function BackgroundSelector() {
  const [selected, setSelected] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSelected(stored);
    } catch {}
  }, []);

  const select = (url: string) => {
    setSelected(url);
    localStorage.setItem(STORAGE_KEY, url);
    // Notify other components
    window.dispatchEvent(new Event("bg-image-change"));
  };

  return (
    <GlassCard className="p-4">
      <h3 className="text-xs font-semibold text-fg-tertiary uppercase tracking-wider mb-3">
        Bakgrundsbild
      </h3>

      <div className="grid grid-cols-3 gap-2">
        {PRESET_IMAGES.map((img) => {
          const isActive = selected === img.url;
          return (
            <button
              key={img.label}
              onClick={() => select(img.url)}
              className={`relative aspect-video rounded-lg overflow-hidden transition-all ${
                isActive
                  ? "ring-2 ring-accent ring-offset-1 ring-offset-transparent"
                  : "ring-1 ring-separator hover:ring-fg-tertiary"
              }`}
            >
              {img.url ? (
                <img
                  src={`${img.url.replace("1920/1080", "320/180")}`}
                  alt={img.label}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-surface flex items-center justify-center">
                  <span className="text-fg-tertiary text-[10px]">Ingen</span>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 py-1">
                <span className="text-[10px] text-white font-medium">{img.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </GlassCard>
  );
}

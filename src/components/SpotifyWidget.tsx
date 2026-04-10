"use client";

import { useState, useEffect } from "react";
import { Music, Play, Pause, SkipForward, SkipBack, Plus } from "lucide-react";
import GlassCard from "./GlassCard";

interface Track { title: string; artist: string; }

export default function SpotifyWidget() {
  const [mounted, setMounted] = useState(false);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newArtist, setNewArtist] = useState("");

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("dashboard-playlist");
    if (saved) { try { setPlaylist(JSON.parse(saved)); } catch { /* */ } }
  }, []);

  useEffect(() => {
    if (!isPlaying || playlist.length === 0) return;
    const interval = setInterval(() => {
      setProgress((prev) => { if (prev >= 100) { nextTrack(); return 0; } return prev + 0.5; });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, trackIndex, playlist.length]);

  function save(updated: Track[]) { setPlaylist(updated); localStorage.setItem("dashboard-playlist", JSON.stringify(updated)); }
  function addTrack() { if (!newTitle.trim()) return; save([...playlist, { title: newTitle.trim(), artist: newArtist.trim() || "Okänd" }]); setNewTitle(""); setNewArtist(""); setShowAdd(false); }
  function nextTrack() { if (playlist.length === 0) return; setTrackIndex((i) => (i + 1) % playlist.length); setProgress(0); }
  function prevTrack() { if (playlist.length === 0) return; if (progress > 10) { setProgress(0); return; } setTrackIndex((i) => (i - 1 + playlist.length) % playlist.length); setProgress(0); }

  if (!mounted) return <GlassCard className="flex items-center justify-center"><div className="h-6 w-24 rounded bg-separator animate-pulse" /></GlassCard>;

  const track = playlist[trackIndex];

  return (
    <GlassCard className="flex flex-col" hover3d={true}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Music size={13} className="text-accent" />
          <p className="text-xs font-medium text-fg-secondary uppercase tracking-wider">Musik</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-ghost !p-1 rounded-lg text-[10px] text-fg-tertiary">
          {showAdd ? "Stäng" : <Plus size={12} />}
        </button>
      </div>

      {showAdd && (
        <div className="flex flex-col gap-1.5 mb-2 p-2 rounded-lg bg-surface/30">
          <input type="text" placeholder="Låttitel" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="input-base !py-1 !text-xs" />
          <div className="flex gap-1.5">
            <input type="text" placeholder="Artist" value={newArtist} onChange={(e) => setNewArtist(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTrack()} className="input-base !py-1 !text-xs flex-1" />
            <button onClick={addTrack} className="btn-primary !py-1 !px-2.5 !text-[10px]">+</button>
          </div>
        </div>
      )}

      {playlist.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Music size={24} className="text-fg-tertiary/30 mb-2" />
          <p className="text-xs text-fg-tertiary">Lägg till musik</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="text-sm font-semibold text-foreground truncate">{track.title}</h3>
            <p className="text-xs text-fg-secondary truncate">{track.artist}</p>
          </div>

          <div>
            <div className="h-0.5 bg-separator rounded-full overflow-hidden mb-2">
              <div className="h-full bg-accent rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
            </div>

            <div className="flex items-center justify-center gap-3">
              <button onClick={prevTrack} className="btn-ghost !p-1.5 rounded-lg"><SkipBack size={14} /></button>
              <button onClick={() => setIsPlaying(!isPlaying)} className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center hover:bg-accent-hover transition-colors">
                {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
              </button>
              <button onClick={nextTrack} className="btn-ghost !p-1.5 rounded-lg"><SkipForward size={14} /></button>
            </div>

            <p className="text-[9px] text-fg-tertiary text-center mt-1.5">{trackIndex + 1} / {playlist.length}</p>
          </div>
        </div>
      )}
    </GlassCard>
  );
}

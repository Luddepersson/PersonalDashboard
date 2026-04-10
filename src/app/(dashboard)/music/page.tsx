"use client";

import { useState, useEffect } from "react";
import { Music, Play, Pause, SkipForward, SkipBack, Plus, Trash2, X } from "lucide-react";

interface Track { title: string; artist: string; }

export default function MusicPage() {
  const [mounted, setMounted] = useState(false);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [newTitle, setNewTitle] = useState("");
  const [newArtist, setNewArtist] = useState("");

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("dashboard-playlist");
    if (saved) { try { setPlaylist(JSON.parse(saved)); } catch {} }
  }, []);

  useEffect(() => {
    if (!isPlaying || playlist.length === 0) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) { nextTrack(); return 0; }
        return prev + 0.5;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, trackIndex, playlist.length]);

  function save(updated: Track[]) {
    setPlaylist(updated);
    localStorage.setItem("dashboard-playlist", JSON.stringify(updated));
  }

  function addTrack() {
    if (!newTitle.trim()) return;
    save([...playlist, { title: newTitle.trim(), artist: newArtist.trim() || "Okand" }]);
    setNewTitle("");
    setNewArtist("");
  }

  function removeTrack(index: number) {
    const updated = playlist.filter((_, i) => i !== index);
    save(updated);
    if (index === trackIndex) { setProgress(0); setIsPlaying(false); }
    if (trackIndex >= updated.length && updated.length > 0) setTrackIndex(updated.length - 1);
  }

  function nextTrack() {
    if (playlist.length === 0) return;
    setTrackIndex((i) => (i + 1) % playlist.length);
    setProgress(0);
  }

  function prevTrack() {
    if (playlist.length === 0) return;
    if (progress > 10) { setProgress(0); return; }
    setTrackIndex((i) => (i - 1 + playlist.length) % playlist.length);
    setProgress(0);
  }

  if (!mounted) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="h-8 w-48 rounded bg-separator animate-pulse" />
          <div className="h-4 w-64 rounded bg-separator animate-pulse mt-3" />
        </div>
        <div className="h-64 rounded-xl bg-separator animate-pulse" />
      </div>
    );
  }

  const track = playlist[trackIndex];
  const progressMinutes = Math.floor((progress / 100) * 3.5);
  const progressSeconds = Math.floor(((progress / 100) * 3.5 * 60) % 60);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tighter">Musik</h1>
        <p className="text-sm text-fg-secondary mt-1.5">Lyssna och hantera din spellista</p>
      </div>

      {/* Now Playing */}
      <div className="glass p-8 sm:p-10 mb-6">
        {playlist.length === 0 ? (
          <div className="text-center py-12">
            <Music size={56} className="text-fg-tertiary/20 mx-auto mb-4" />
            <p className="text-lg text-fg-tertiary">Ingen musik i spellistan</p>
            <p className="text-sm text-fg-tertiary/60 mt-1">Lagg till latar nedan for att borja lyssna</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {/* Album art placeholder */}
            <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl bg-surface/50 flex items-center justify-center mb-8 border border-separator">
              <Music size={48} className="text-accent/30" />
            </div>

            {/* Track info */}
            <h2 className="text-2xl font-bold text-foreground text-center">{track.title}</h2>
            <p className="text-base text-fg-secondary mt-1">{track.artist}</p>

            {/* Progress bar */}
            <div className="w-full max-w-md mt-8">
              <div className="h-1.5 bg-separator rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-fg-tertiary font-mono">
                  {progressMinutes}:{progressSeconds.toString().padStart(2, "0")}
                </span>
                <span className="text-xs text-fg-tertiary font-mono">3:30</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-6 mt-6">
              <button onClick={prevTrack} className="btn-ghost p-3 rounded-xl">
                <SkipBack size={24} />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-16 h-16 rounded-full bg-accent text-white flex items-center justify-center hover:bg-accent-hover transition-colors shadow-lg"
              >
                {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
              </button>
              <button onClick={nextTrack} className="btn-ghost p-3 rounded-xl">
                <SkipForward size={24} />
              </button>
            </div>

            <p className="text-xs text-fg-tertiary mt-4">
              Lat {trackIndex + 1} av {playlist.length}
            </p>
          </div>
        )}
      </div>

      {/* Add Track Form */}
      <div className="glass p-5 sm:p-6 mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-3">Lagg till lat</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Lattitel..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="input-base flex-1 !py-2.5"
          />
          <input
            type="text"
            placeholder="Artist..."
            value={newArtist}
            onChange={(e) => setNewArtist(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTrack()}
            className="input-base flex-1 !py-2.5"
          />
          <button onClick={addTrack} className="btn-primary !py-2.5 !px-5 flex items-center gap-2 shrink-0">
            <Plus size={16} /> Lagg till
          </button>
        </div>
      </div>

      {/* Playlist */}
      {playlist.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Spellista ({playlist.length} latar)
          </h2>
          <div className="space-y-2">
            {playlist.map((t, i) => (
              <div
                key={i}
                onClick={() => { setTrackIndex(i); setProgress(0); setIsPlaying(true); }}
                className={`glass flex items-center gap-4 p-4 cursor-pointer transition-all group ${
                  i === trackIndex ? "ring-1 ring-accent/30 bg-accent/5" : "hover:bg-surface/50"
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  i === trackIndex && isPlaying
                    ? "bg-accent text-white"
                    : "bg-surface/50 text-fg-tertiary"
                }`}>
                  {i === trackIndex && isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium truncate ${
                    i === trackIndex ? "text-accent" : "text-foreground"
                  }`}>{t.title}</p>
                  <p className="text-xs text-fg-tertiary truncate">{t.artist}</p>
                </div>
                <span className="text-xs text-fg-tertiary font-mono">3:30</span>
                <button
                  onClick={(e) => { e.stopPropagation(); removeTrack(i); }}
                  className="opacity-0 group-hover:opacity-100 btn-ghost p-1.5 text-fg-tertiary hover:text-accent-warm transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

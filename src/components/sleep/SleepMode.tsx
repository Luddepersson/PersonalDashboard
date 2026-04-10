"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

interface SleepModeProps { isActive: boolean; onExit: () => void; }

const PALETTES = [
  { name: "Emerald Chrome", bg: "linear-gradient(135deg, #010528 0%, #004B8E80 100%)", c1: "0,180,216", c2: "0,150,199", orb: "56,189,248" },
  { name: "Navy Mirage", bg: "linear-gradient(135deg, #141E30 0%, #3F5E9680 100%)", c1: "109,157,209", c2: "74,125,184", orb: "99,132,199" },
  { name: "Midnight Gold", bg: "linear-gradient(135deg, #1A1A1A 0%, #8B734080 100%)", c1: "212,168,86", c2: "176,138,62", orb: "212,180,100" },
  { name: "Royal Aurora", bg: "linear-gradient(135deg, #3E2F5B 0%, #E9456080 100%)", c1: "233,69,96", c2: "201,58,82", orb: "244,114,182" },
  { name: "Obsidian Plum", bg: "linear-gradient(135deg, #2D1E2F 0%, #4E2A4F80 100%)", c1: "176,106,179", c2: "138,74,141", orb: "200,130,200" },
];

export default function SleepMode({ isActive, onExit }: SleepModeProps) {
  const [now, setNow] = useState(new Date());
  const [idx, setIdx] = useState(0);
  const [prevIdx, setPrevIdx] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!isActive) return;
    (async () => { try { await document.documentElement.requestFullscreen(); } catch {} })();
    return () => { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); };
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;
    setNow(new Date());
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, [isActive]);

  // Crossfade between themes
  useEffect(() => {
    if (!isActive) return;
    const i = setInterval(() => {
      setPrevIdx((p) => idx); // current becomes previous
      setIdx((p) => (p + 1) % PALETTES.length);
      setFading(true);
      // After fade completes, swap layers
      setTimeout(() => setFading(false), 5000);
    }, 15000);
    return () => clearInterval(i);
  }, [isActive, idx]);

  const handleExit = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    onExit();
  }, [onExit]);

  useEffect(() => {
    if (!isActive) return;
    const fn = () => handleExit();
    const t = setTimeout(() => window.addEventListener("keydown", fn), 600);
    return () => { clearTimeout(t); window.removeEventListener("keydown", fn); };
  }, [isActive, handleExit]);

  const current = PALETTES[idx];
  const prev = PALETTES[prevIdx];

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
          onClick={handleExit}
          className="fixed inset-0 z-[200] cursor-pointer overflow-hidden select-none"
          style={{ backgroundColor: "#050810" }}
        >
          {/* Background crossfade — two layers, opacity transition */}
          <div className="absolute inset-0" style={{ background: prev.bg, opacity: fading ? 0 : 1, transition: "opacity 5s ease-in-out" }} />
          <div className="absolute inset-0" style={{ background: current.bg, opacity: fading ? 1 : 0, transition: "opacity 5s ease-in-out" }} />
          {/* After fade completes, prev layer shows current anyway since prevIdx updates */}

          {/* Aurora — two sets that crossfade */}
          <div className="absolute inset-0 sleep-aurora-a" style={{ background: `radial-gradient(ellipse at 25% 30%, rgba(${prev.c1}, 0.1) 0%, transparent 60%)`, opacity: fading ? 0 : 1, transition: "opacity 5s ease-in-out" }} />
          <div className="absolute inset-0 sleep-aurora-a" style={{ background: `radial-gradient(ellipse at 25% 30%, rgba(${current.c1}, 0.1) 0%, transparent 60%)`, opacity: fading ? 1 : 0, transition: "opacity 5s ease-in-out" }} />

          <div className="absolute inset-0 sleep-aurora-b" style={{ background: `radial-gradient(ellipse at 75% 70%, rgba(${prev.c2}, 0.08) 0%, transparent 55%)`, opacity: fading ? 0 : 1, transition: "opacity 5s ease-in-out" }} />
          <div className="absolute inset-0 sleep-aurora-b" style={{ background: `radial-gradient(ellipse at 75% 70%, rgba(${current.c2}, 0.08) 0%, transparent 55%)`, opacity: fading ? 1 : 0, transition: "opacity 5s ease-in-out" }} />

          {/* Orbs — opacity crossfade */}
          {[
            { s: 600, t: "5%", l: "0%", d: "a" },
            { s: 500, t: "auto", b: "0%", r: "5%", d: "b" },
            { s: 420, t: "35%", r: "20%", d: "c" },
            { s: 380, t: "auto", b: "15%", l: "20%", d: "d" },
            { s: 480, t: "15%", l: "35%", d: "e" },
          ].map((o, i) => (
            <div key={i}>
              <div className={`absolute rounded-full sleep-orb-${o.d}`}
                style={{ width: o.s, height: o.s, top: o.t, bottom: (o as Record<string, unknown>).b as string | undefined, left: (o as Record<string, unknown>).l as string | undefined, right: (o as Record<string, unknown>).r as string | undefined, background: `radial-gradient(circle, rgba(${prev.orb}, 0.07) 0%, transparent 70%)`, opacity: fading ? 0 : 1, transition: "opacity 5s ease-in-out" }}
              />
              <div className={`absolute rounded-full sleep-orb-${o.d}`}
                style={{ width: o.s, height: o.s, top: o.t, bottom: (o as Record<string, unknown>).b as string | undefined, left: (o as Record<string, unknown>).l as string | undefined, right: (o as Record<string, unknown>).r as string | undefined, background: `radial-gradient(circle, rgba(${current.orb}, 0.07) 0%, transparent 70%)`, opacity: fading ? 1 : 0, transition: "opacity 5s ease-in-out" }}
              />
            </div>
          ))}

          {/* Stars */}
          <div className="absolute inset-0 sleep-stars" />

          {/* Clock */}
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1.8, delay: 0.4 }} className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="flex items-baseline">
              <span className="text-6xl sm:text-8xl md:text-[16rem] font-[100] text-white/90 tracking-[-0.04em] leading-none">{format(now, "HH")}</span>
              <span className="text-4xl sm:text-6xl md:text-[10rem] font-[100] mx-1 sm:mx-2 md:mx-4 sleep-colon" style={{ color: `rgba(${current.c1}, 0.4)`, transition: "color 5s ease-in-out" }}>:</span>
              <span className="text-6xl sm:text-8xl md:text-[16rem] font-[100] text-white/90 tracking-[-0.04em] leading-none">{format(now, "mm")}</span>
            </div>
            <p className="text-sm sm:text-lg md:text-2xl text-white/50 font-light mt-2 sm:mt-3 md:mt-8 capitalize tracking-[0.1em] sm:tracking-[0.15em]">{format(now, "EEEE, d MMMM", { locale: sv })}</p>
            <p className="text-[10px] text-white/10 mt-4 tracking-[0.2em] uppercase font-light" style={{ transition: "opacity 3s" }}>{current.name}</p>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 4, duration: 2 }} className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/[0.06] text-[10px] tracking-[0.3em] uppercase">
            Tryck för att avsluta
          </motion.p>

          <style>{`
            .sleep-aurora-a { animation: auroraA 18s ease-in-out infinite; }
            .sleep-aurora-b { animation: auroraB 22s ease-in-out infinite; }
            @keyframes auroraA { 0%, 100% { transform: translate(-3%,-2%) scale(1); } 50% { transform: translate(4%,3%) scale(1.1); } }
            @keyframes auroraB { 0%, 100% { transform: translate(3%,2%) scale(1.05); } 50% { transform: translate(-4%,-3%) scale(1); } }
            .sleep-orb-a { animation: orbA 24s ease-in-out infinite; }
            .sleep-orb-b { animation: orbB 28s ease-in-out infinite; }
            .sleep-orb-c { animation: orbC 20s ease-in-out infinite; }
            .sleep-orb-d { animation: orbD 26s ease-in-out infinite; }
            .sleep-orb-e { animation: orbE 22s ease-in-out infinite; }
            @keyframes orbA { 0%,100%{transform:translate(0,0)} 25%{transform:translate(40px,-25px)} 50%{transform:translate(-20px,35px)} 75%{transform:translate(25px,10px)} }
            @keyframes orbB { 0%,100%{transform:translate(0,0)} 33%{transform:translate(-35px,25px)} 66%{transform:translate(25px,-20px)} }
            @keyframes orbC { 0%,100%{transform:translate(0,0)} 50%{transform:translate(30px,30px)} }
            @keyframes orbD { 0%,100%{transform:translate(0,0)} 40%{transform:translate(-25px,-30px)} 80%{transform:translate(20px,25px)} }
            @keyframes orbE { 0%,100%{transform:translate(0,0)} 30%{transform:translate(20px,-35px)} 70%{transform:translate(-30px,15px)} }
            .sleep-colon { animation: colonPulse 2.5s ease-in-out infinite; }
            @keyframes colonPulse { 0%,100%{opacity:0.15} 50%{opacity:0.5} }
            .sleep-stars {
              background-image: radial-gradient(1px 1px at 8% 15%,rgba(255,255,255,.18) 50%,transparent 100%),radial-gradient(1.2px 1.2px at 22% 55%,rgba(255,255,255,.12) 50%,transparent 100%),radial-gradient(1px 1px at 35% 8%,rgba(255,255,255,.15) 50%,transparent 100%),radial-gradient(.8px .8px at 48% 42%,rgba(255,255,255,.1) 50%,transparent 100%),radial-gradient(1px 1px at 62% 78%,rgba(255,255,255,.14) 50%,transparent 100%),radial-gradient(1.3px 1.3px at 75% 25%,rgba(255,255,255,.09) 50%,transparent 100%),radial-gradient(.8px .8px at 88% 65%,rgba(255,255,255,.13) 50%,transparent 100%),radial-gradient(1px 1px at 15% 82%,rgba(255,255,255,.11) 50%,transparent 100%);
              animation: twinkle 6s ease-in-out infinite alternate;
            }
            @keyframes twinkle { 0%{opacity:.3} 50%{opacity:.7} 100%{opacity:.4} }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

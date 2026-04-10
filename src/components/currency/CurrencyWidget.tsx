"use client";

import { useState, useEffect } from "react";
import GlassCard from "../GlassCard";
import { ArrowRightLeft, RefreshCw } from "lucide-react";

interface Rates { [key: string]: number; }

const CURRENCIES = [
  { code: "SEK", flag: "🇸🇪", name: "Svensk krona" },
  { code: "EUR", flag: "🇪🇺", name: "Euro" },
  { code: "USD", flag: "🇺🇸", name: "US Dollar" },
  { code: "GBP", flag: "🇬🇧", name: "Brittiskt pund" },
];

export default function CurrencyWidget() {
  const [mounted, setMounted] = useState(false);
  const [rates, setRates] = useState<Rates | null>(null);
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("SEK");
  const [to, setTo] = useState("EUR");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    setLoading(true);
    fetch("https://api.exchangerate-api.com/v4/latest/SEK")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => { setRates(data.rates); setError(""); })
      .catch(() => setError("Kunde inte hämta växelkurser"))
      .finally(() => setLoading(false));
  }, [mounted]);

  const convert = (amt: number, f: string, t: string): string => {
    if (!rates) return "—";
    const inSek = f === "SEK" ? amt : amt / rates[f];
    const result = t === "SEK" ? inSek : inSek * rates[t];
    return result.toFixed(2);
  };

  const swap = () => { setFrom(to); setTo(from); };
  const parsed = parseFloat(amount) || 0;

  if (!mounted) return <GlassCard className="h-[280px]"><div /></GlassCard>;

  return (
    <GlassCard className="h-[280px] flex flex-col p-4">
      <div className="flex items-center gap-2 mb-3">
        <ArrowRightLeft size={16} className="text-accent" />
        <h3 className="text-foreground font-semibold text-sm">Valutaväxlare</h3>
        {loading && <RefreshCw size={12} className="animate-spin text-fg-tertiary ml-auto" />}
      </div>

      {error && <p className="text-red-400 text-xs mb-2">{error}</p>}

      <div className="space-y-2 mb-3">
        <input
          type="number"
          className="input-base w-full text-sm"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Belopp"
        />
        <div className="flex items-center gap-2">
          <select className="input-base flex-1 text-sm" value={from} onChange={(e) => setFrom(e.target.value)}>
            {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
          </select>
          <button onClick={swap} className="btn-ghost p-1.5 rounded" title="Byt">
            <ArrowRightLeft size={14} />
          </button>
          <select className="input-base flex-1 text-sm" value={to} onChange={(e) => setTo(e.target.value)}>
            {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white/5 rounded-lg p-3 mb-3 text-center">
        <p className="text-foreground text-lg font-bold">
          {convert(parsed, from, to)} <span className="text-fg-secondary text-sm">{to}</span>
        </p>
        <p className="text-fg-tertiary text-[10px]">
          {CURRENCIES.find((c) => c.code === from)?.flag} {parsed} {from} → {CURRENCIES.find((c) => c.code === to)?.flag} {to}
        </p>
      </div>

      <div className="flex-1 min-h-0">
        <p className="text-fg-tertiary text-[10px] mb-1">Kurser (1 SEK)</p>
        <div className="grid grid-cols-3 gap-1">
          {CURRENCIES.filter((c) => c.code !== "SEK").map((c) => (
            <div key={c.code} className="text-center">
              <p className="text-[10px] text-fg-tertiary">{c.flag} {c.code}</p>
              <p className="text-foreground text-xs font-medium">{rates ? rates[c.code]?.toFixed(4) : "—"}</p>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

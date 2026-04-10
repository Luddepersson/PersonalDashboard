"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import GlassCard from "../GlassCard";
import { TrendingUp, TrendingDown, Plus, X, RefreshCw, Bitcoin } from "lucide-react";

type AssetType = "stock" | "crypto";

interface Asset {
  symbol: string;
  name: string;
  price: number;
  change: number;
  type: AssetType;
  currency: string;
}

interface TrackedSymbol {
  symbol: string;
  type: AssetType;
}

const LS_KEY = "dashboard-stocks";

// Well-known crypto IDs for CoinGecko
const CRYPTO_MAP: Record<string, { id: string; name: string }> = {
  BTC: { id: "bitcoin", name: "Bitcoin" },
  ETH: { id: "ethereum", name: "Ethereum" },
  SOL: { id: "solana", name: "Solana" },
  ADA: { id: "cardano", name: "Cardano" },
  DOT: { id: "polkadot", name: "Polkadot" },
  DOGE: { id: "dogecoin", name: "Dogecoin" },
  XRP: { id: "ripple", name: "XRP" },
  AVAX: { id: "avalanche-2", name: "Avalanche" },
  LINK: { id: "chainlink", name: "Chainlink" },
  MATIC: { id: "matic-network", name: "Polygon" },
  UNI: { id: "uniswap", name: "Uniswap" },
  LTC: { id: "litecoin", name: "Litecoin" },
  SHIB: { id: "shiba-inu", name: "Shiba Inu" },
};

const STOCK_NAMES: Record<string, string> = {
  AAPL: "Apple Inc.",
  MSFT: "Microsoft Corp.",
  GOOGL: "Alphabet Inc.",
  TSLA: "Tesla Inc.",
  AMZN: "Amazon.com",
  NVDA: "NVIDIA Corp.",
  META: "Meta Platforms",
  "VOLV-B.ST": "Volvo B",
  "ERIC-B.ST": "Ericsson B",
  "HM-B.ST": "H&M B",
  "SEB-A.ST": "SEB A",
  "INVE-B.ST": "Investor B",
  "ABB.ST": "ABB Ltd",
};

function getTracked(): TrackedSymbol[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    // Migrate old format (string[]) to new format
    if (Array.isArray(parsed) && typeof parsed[0] === "string") {
      const migrated = parsed.map((s: string) => ({
        symbol: s,
        type: (CRYPTO_MAP[s] ? "crypto" : "stock") as AssetType,
      }));
      localStorage.setItem(LS_KEY, JSON.stringify(migrated));
      return migrated;
    }
    return parsed;
  } catch {
    return [];
  }
}

async function fetchCryptoPrices(symbols: string[]): Promise<Asset[]> {
  if (symbols.length === 0) return [];
  const ids = symbols
    .map((s) => CRYPTO_MAP[s]?.id)
    .filter(Boolean)
    .join(",");
  if (!ids) return [];

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
    );
    if (!res.ok) throw new Error("CoinGecko fetch failed");
    const data = await res.json();

    return symbols
      .filter((s) => CRYPTO_MAP[s])
      .map((s) => {
        const info = CRYPTO_MAP[s];
        const coin = data[info.id];
        if (!coin) return null;
        return {
          symbol: s,
          name: info.name,
          price: coin.usd ?? 0,
          change: parseFloat((coin.usd_24h_change ?? 0).toFixed(2)),
          type: "crypto" as AssetType,
          currency: "USD",
        };
      })
      .filter(Boolean) as Asset[];
  } catch (e) {
    console.warn("CoinGecko error:", e);
    return symbols
      .filter((s) => CRYPTO_MAP[s])
      .map((s) => ({
        symbol: s,
        name: CRYPTO_MAP[s].name,
        price: 0,
        change: 0,
        type: "crypto" as AssetType,
        currency: "USD",
      }));
  }
}

async function fetchStockPrice(symbol: string): Promise<Asset | null> {
  // Try Alpha Vantage with demo key first
  try {
    const res = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=demo`
    );
    if (res.ok) {
      const data = await res.json();
      const q = data["Global Quote"];
      if (q && q["05. price"]) {
        return {
          symbol: symbol.toUpperCase(),
          name: STOCK_NAMES[symbol.toUpperCase()] || symbol.toUpperCase(),
          price: parseFloat(q["05. price"]),
          change: parseFloat(q["10. change percent"]?.replace("%", "") || "0"),
          type: "stock",
          currency: symbol.includes(".ST") ? "SEK" : "USD",
        };
      }
    }
  } catch {
    /* fallthrough */
  }

  // Fallback: allorigins + Yahoo Finance
  try {
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(yahooUrl)}`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const wrapper = await res.json();
      const data = JSON.parse(wrapper.contents);
      const result = data?.chart?.result?.[0];
      if (result) {
        const meta = result.meta;
        const price = meta.regularMarketPrice;
        const prevClose = meta.chartPreviousClose || meta.previousClose;
        const change = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;
        return {
          symbol: symbol.toUpperCase(),
          name: STOCK_NAMES[symbol.toUpperCase()] || symbol.toUpperCase(),
          price: parseFloat(price.toFixed(2)),
          change: parseFloat(change.toFixed(2)),
          type: "stock",
          currency: meta.currency || (symbol.includes(".ST") ? "SEK" : "USD"),
        };
      }
    }
  } catch {
    /* fallthrough */
  }

  return null;
}

async function fetchStockPrices(symbols: string[]): Promise<Asset[]> {
  if (symbols.length === 0) return [];
  const results = await Promise.allSettled(symbols.map(fetchStockPrice));
  return results
    .map((r) => (r.status === "fulfilled" ? r.value : null))
    .filter(Boolean) as Asset[];
}

export default function StockWidget() {
  const [mounted, setMounted] = useState(false);
  const [tracked, setTracked] = useState<TrackedSymbol[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [newSymbol, setNewSymbol] = useState("");
  const [addType, setAddType] = useState<AssetType>("stock");
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setMounted(true);
    setTracked(getTracked());
  }, []);

  const refresh = useCallback(
    async (items: TrackedSymbol[]) => {
      if (items.length === 0) {
        setAssets([]);
        return;
      }
      setLoading(true);
      try {
        const cryptoSyms = items.filter((t) => t.type === "crypto").map((t) => t.symbol);
        const stockSyms = items.filter((t) => t.type === "stock").map((t) => t.symbol);

        const [cryptoResults, stockResults] = await Promise.all([
          fetchCryptoPrices(cryptoSyms),
          fetchStockPrices(stockSyms),
        ]);

        // Merge and preserve order
        const resultMap = new Map<string, Asset>();
        [...cryptoResults, ...stockResults].forEach((a) => resultMap.set(a.symbol, a));

        const ordered = items
          .map((t) => resultMap.get(t.symbol))
          .filter(Boolean) as Asset[];

        setAssets(ordered);
        setLastUpdated(new Date());
      } catch (e) {
        console.error("Refresh error:", e);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (mounted) refresh(tracked);
  }, [mounted, tracked, refresh]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (!mounted) return;
    intervalRef.current = setInterval(() => refresh(tracked), 60000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [mounted, tracked, refresh]);

  const save = (items: TrackedSymbol[]) => {
    setTracked(items);
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  };

  const addSymbol = () => {
    const sym = newSymbol.trim().toUpperCase();
    if (!sym || tracked.some((t) => t.symbol === sym)) return;
    if (addType === "crypto" && !CRYPTO_MAP[sym]) {
      alert(`Okand krypto-symbol: ${sym}. Tillgangliga: ${Object.keys(CRYPTO_MAP).join(", ")}`);
      return;
    }
    const updated = [...tracked, { symbol: sym, type: addType }];
    save(updated);
    setNewSymbol("");
  };

  const removeSymbol = (sym: string) => save(tracked.filter((t) => t.symbol !== sym));

  if (!mounted) return <GlassCard className="h-[280px]"><div /></GlassCard>;

  return (
    <GlassCard className="h-[280px] flex flex-col p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-accent" />
          <h3 className="text-foreground font-semibold text-sm">Aktier & Krypto</h3>
        </div>
        <div className="flex items-center gap-1.5">
          {loading && (
            <RefreshCw size={12} className="text-fg-tertiary animate-spin" />
          )}
          <button
            onClick={() => refresh(tracked)}
            className="btn-ghost p-1 rounded"
            title="Uppdatera nu"
          >
            <RefreshCw size={12} className="text-fg-tertiary" />
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-2">
        <select
          className="input-base text-[10px] w-16 px-1 py-1 rounded"
          value={addType}
          onChange={(e) => setAddType(e.target.value as AssetType)}
        >
          <option value="stock">Aktie</option>
          <option value="crypto">Krypto</option>
        </select>
        <input
          className="input-base text-xs flex-1"
          placeholder={addType === "crypto" ? "T.ex. BTC, ETH, SOL..." : "T.ex. AAPL, MSFT..."}
          value={newSymbol}
          onChange={(e) => setNewSymbol(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addSymbol()}
        />
        <button onClick={addSymbol} className="btn-primary p-1.5 rounded" title="Lagg till">
          <Plus size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
        {assets.length === 0 && !loading && (
          <p className="text-fg-secondary text-xs text-center mt-6">
            Inga tillgangar tillagda. Valj typ och lagg till en symbol ovan.
          </p>
        )}
        {assets.map((asset) => (
          <div
            key={asset.symbol}
            className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-white/5 transition-colors group"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {asset.type === "crypto" && <Bitcoin size={11} className="text-amber-400 shrink-0" />}
                <span className="text-foreground text-xs font-bold">{asset.symbol}</span>
                <span className="text-fg-tertiary text-[10px] truncate">{asset.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-foreground text-xs font-medium">
                {asset.price > 0
                  ? `${asset.price.toLocaleString("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${asset.currency}`
                  : "---"}
              </span>
              <span
                className={`flex items-center gap-0.5 text-[11px] font-medium ${
                  asset.change >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {asset.change >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {asset.change >= 0 ? "+" : ""}
                {asset.change}%
              </span>
              <button
                onClick={() => removeSymbol(asset.symbol)}
                className="btn-ghost p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer with timestamp */}
      <div className="flex items-center justify-between mt-1 pt-1 border-t border-white/5">
        <span className="text-[9px] text-fg-tertiary">
          {lastUpdated
            ? `Senast uppdaterad: ${lastUpdated.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
            : "Laddar..."}
        </span>
        <span className="text-[9px] text-fg-tertiary">Auto var 60:e sek</span>
      </div>
    </GlassCard>
  );
}

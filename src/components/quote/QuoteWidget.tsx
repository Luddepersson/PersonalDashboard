"use client";

import { useState, useEffect } from "react";
import GlassCard from "../GlassCard";
import { Quote, Shuffle } from "lucide-react";

interface QuoteData { text: string; author: string; }

const QUOTES: QuoteData[] = [
  { text: "Det enda sättet att göra ett fantastiskt arbete är att älska det du gör.", author: "Steve Jobs" },
  { text: "Framtiden tillhör dem som tror på skönheten i sina drömmar.", author: "Eleanor Roosevelt" },
  { text: "Varje dag är en ny chans att förändra ditt liv.", author: "Okänd" },
  { text: "Den som aldrig gör misstag, gör heller aldrig något.", author: "Okänd" },
  { text: "Livet är inte att vänta på stormen, utan att lära sig dansa i regnet.", author: "Vivian Greene" },
  { text: "Tro på dig själv och allt som du är.", author: "Christian D. Larson" },
  { text: "Framgång är inte slutgiltig, misslyckande är inte ödesdigert: det är modet att fortsätta som räknas.", author: "Winston Churchill" },
  { text: "Gör det du kan, med det du har, där du är.", author: "Theodore Roosevelt" },
  { text: "Varje expert var en gång nybörjare.", author: "Helen Hayes" },
  { text: "Det är aldrig för sent att vara den du kunde ha varit.", author: "George Eliot" },
  { text: "Att våga är att förlora fotfästet en stund. Att inte våga är att förlora sig själv.", author: "Søren Kierkegaard" },
  { text: "Den bästa tiden att plantera ett träd var för tjugo år sedan. Den näst bästa tiden är nu.", author: "Kinesiskt ordspråk" },
  { text: "Lycka beror inte på vad du har, utan på vad du tänker.", author: "Buddha" },
  { text: "Ingenting är omöjligt. Ordet självt säger 'I'm possible'.", author: "Audrey Hepburn" },
  { text: "Det enda du behöver för att börja är att sluta prata och börja göra.", author: "Walt Disney" },
  { text: "Du missar 100% av de skott du aldrig tar.", author: "Wayne Gretzky" },
  { text: "Kunskap är makt.", author: "Francis Bacon" },
  { text: "Svårigheter förbereder vanliga människor för extraordinära öden.", author: "C.S. Lewis" },
  { text: "Var förändringen du vill se i världen.", author: "Mahatma Gandhi" },
  { text: "Kreativitet är intelligens som har kul.", author: "Albert Einstein" },
  { text: "Livet börjar vid slutet av din komfortzon.", author: "Neale Donald Walsch" },
  { text: "Enkelhet är den yttersta förfiningen.", author: "Leonardo da Vinci" },
  { text: "Den som rör sig framåt, om än sakta, slår den som står stilla.", author: "Okänd" },
  { text: "Lär av igår, lev för idag, hoppas på imorgon.", author: "Albert Einstein" },
  { text: "Stor konst börjar där naturen slutar.", author: "Marc Chagall" },
  { text: "Det finns inga genvägar till någon plats som är värd att gå till.", author: "Beverly Sills" },
  { text: "Vad som inte dödar dig gör dig starkare.", author: "Friedrich Nietzsche" },
  { text: "Handling behöver inte alltid vara reaktiv, den kan vara kreativ.", author: "Okänd" },
  { text: "Mod är inte frånvaron av rädsla, utan bedömningen att något är viktigare.", author: "Ambrose Redmoon" },
  { text: "Om du kan drömma det kan du göra det.", author: "Walt Disney" },
  { text: "Optimism är tron som leder till prestation.", author: "Helen Keller" },
];

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86400000);
}

export default function QuoteWidget() {
  const [mounted, setMounted] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setMounted(true);
    setIndex(getDayOfYear() % QUOTES.length);
  }, []);

  const randomize = () => {
    let next: number;
    do { next = Math.floor(Math.random() * QUOTES.length); } while (next === index && QUOTES.length > 1);
    setIndex(next);
  };

  if (!mounted) return <GlassCard className="h-[280px]"><div /></GlassCard>;

  const q = QUOTES[index];

  return (
    <GlassCard className="h-[280px] flex flex-col p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Quote size={16} className="text-accent" />
          <h3 className="text-foreground font-semibold text-sm">Dagens citat</h3>
        </div>
        <button onClick={randomize} className="btn-ghost p-1 rounded" title="Ny">
          <Shuffle size={14} />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center px-2 relative">
        <span className="text-accent/20 text-6xl font-serif absolute top-0 left-2 select-none leading-none">&ldquo;</span>
        <p className="text-foreground text-sm italic leading-relaxed mb-3 relative z-10">
          {q.text}
        </p>
        <p className="text-fg-secondary text-xs">
          — {q.author}
        </p>
        <span className="text-accent/20 text-6xl font-serif absolute bottom-0 right-2 select-none leading-none rotate-180">&ldquo;</span>
      </div>
    </GlassCard>
  );
}

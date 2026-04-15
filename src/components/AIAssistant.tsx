"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, Send, X, Minimize2, Maximize2, Bot, User, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const TIPS = [
  "Prova Pomodoro-tekniken: 25 min fokus, 5 min paus. Efter 4 omgångar, ta en längre paus.",
  "Skriv ner dina tre viktigaste uppgifter varje morgon innan du börjar jobba.",
  "Ta micro-pauser var 45:e minut. Sträck på dig, titta ut genom fönstret.",
  "Gruppera liknande uppgifter och kör dem i block — det sparar mental energi.",
  "Stäng av notifikationer under fokustid. Din hjärna behöver 23 minuter för att återfå fullt fokus.",
  "Ät grodan först — gör den svåraste uppgiften tidigt på dagen när energin är som högst.",
  "Använd 2-minutersregeln: om något tar under 2 min, gör det direkt istället för att skriva upp det.",
  "Planera morgondagen kvällen innan. Du sover bättre och startar dagen snabbare.",
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "God natt! Borde du inte sova?";
  if (h < 12) return "God morgon! Redo att vara produktiv?";
  if (h < 17) return "God eftermiddag! Hur går dagen?";
  return "God kväll! Dags att summera dagen?";
}

function generateResponse(input: string): string {
  const lower = input.toLowerCase();

  if (lower.includes("uppgift") || lower.includes("todo") || lower.includes("att göra")) {
    try {
      const todos = JSON.parse(localStorage.getItem("dashboard-todos") || "[]");
      const done = todos.filter((t: { done: boolean }) => t.done).length;
      const undone = todos.filter((t: { done: boolean }) => !t.done);
      if (todos.length === 0) return "Du har inga uppgifter ännu. Gå till Uppgifter-sidan och lägg till några!";
      let msg = `Du har **${todos.length} uppgifter** totalt, varav **${done} klara** och **${undone.length} kvar**.\n\n`;
      if (undone.length > 0) {
        msg += "Nästa att göra:\n";
        undone.slice(0, 3).forEach((t: { text: string }) => { msg += `• ${t.text}\n`; });
      }
      if (done === todos.length) msg += "\n🎉 Alla klara! Fantastiskt jobbat!";
      return msg;
    } catch { return "Kunde inte läsa dina uppgifter."; }
  }

  if (lower.includes("sammanfattning") || lower.includes("summary") || lower.includes("idag") || lower.includes("status")) {
    try {
      const todos = JSON.parse(localStorage.getItem("dashboard-todos") || "[]");
      const habits = JSON.parse(localStorage.getItem("dashboard-habits") || "[]");
      const pomodoros = parseInt(localStorage.getItem("pomodoro-count") || "0", 10);
      const today = new Date().toISOString().split("T")[0];
      const todosDone = todos.filter((t: { done: boolean }) => t.done).length;
      const habitsDone = habits.filter((h: { completedDates: string[] }) => h.completedDates?.includes(today)).length;
      const focusHours = Math.round(pomodoros * 25 / 60 * 10) / 10;

      let msg = `📊 **Dagens sammanfattning:**\n\n`;
      msg += `• Uppgifter: **${todosDone}/${todos.length}** klara\n`;
      msg += `• Vanor: **${habitsDone}/${habits.length}** avklarade\n`;
      msg += `• Pomodoros: **${pomodoros}** (~${focusHours}h fokustid)\n\n`;

      const score = todos.length + habits.length > 0
        ? Math.round(((todosDone + habitsDone) / (todos.length + habits.length)) * 100)
        : 0;
      if (score >= 80) msg += "🔥 Otroligt bra jobbat idag!";
      else if (score >= 50) msg += "👍 Bra progress! Fortsätt så.";
      else if (score > 0) msg += "💪 Du har kommit igång — kör på!";
      else msg += "✨ En ny dag, nya möjligheter!";
      return msg;
    } catch { return "Kunde inte sammanfatta dagen."; }
  }

  if (lower.includes("tips") || lower.includes("hjälp") || lower.includes("råd")) {
    return `💡 **Produktivitetstips:**\n\n${TIPS[Math.floor(Math.random() * TIPS.length)]}`;
  }

  if (lower.includes("pomodoro") || lower.includes("fokus") || lower.includes("timer")) {
    return "⏱️ Tryck **F** för att gå in i fokusläge, eller navigera till Pomodoro-sidan i sidebaren. Jag rekommenderar 25-minuterspass med korta pauser!";
  }

  if (lower.includes("hej") || lower.includes("hallå") || lower.includes("tja")) {
    return `${getGreeting()} Fråga mig om dina uppgifter, be om en sammanfattning, eller säg "tips" för produktivitetsråd!`;
  }

  if (lower.includes("vem") || lower.includes("vad kan du")) {
    return "Jag är **Jarvis** — din personliga produktivitetsassistent! 🤖\n\nJag kan:\n• Visa dina **uppgifter** och status\n• Ge en **sammanfattning** av dagen\n• Dela **produktivitetstips**\n• Hjälpa dig med **pomodoro** och fokus\n\nFråga mig vad som helst!";
  }

  return `Jag förstår inte riktigt. Prova:\n• **"uppgifter"** — se dina todos\n• **"sammanfattning"** — dagens status\n• **"tips"** — produktivitetsråd\n• **"vem är du"** — lär känna mig`;
}

// Exported as widget for the dashboard
export default function AIAssistantWidget() {
  return <JarvisChat embedded />;
}

// Exported for the floating button
export function JarvisFloating() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Floating trigger button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-4 right-3 sm:bottom-6 sm:right-6 z-[80] w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#2e94be] via-[#4cb4d8] to-[#6aafc8] text-white flex items-center justify-center shadow-[0_8px_30px_rgba(46,148,190,0.35)] hover:shadow-[0_12px_40px_rgba(46,148,190,0.45)] hover:scale-105 active:scale-95 transition-all"
            aria-label="Öppna AI-assistent"
          >
            <Sparkles size={22} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`fixed z-[80] ${isExpanded ? "inset-2 sm:inset-4 lg:inset-8" : "bottom-4 right-2 left-2 sm:left-auto sm:right-6 sm:w-[380px] h-[480px] sm:h-[520px]"} transition-all duration-300`}
          >
            <JarvisChat
              onClose={() => setIsOpen(false)}
              isExpanded={isExpanded}
              onToggleExpand={() => setIsExpanded(!isExpanded)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function JarvisChat({ onClose, isExpanded, onToggleExpand, embedded }: {
  onClose?: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  embedded?: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: `${getGreeting()}\n\nJag är **Jarvis**, din produktivitetsassistent. Fråga mig om uppgifter, be om en sammanfattning, eller säg "tips"!`, timestamp: new Date() },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  function handleSend() {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input.trim(), timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    const query = input.trim();
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const response = generateResponse(query);
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: response, timestamp: new Date() }]);
      setIsTyping(false);
    }, 400 + Math.random() * 400);
  }

  const containerClass = embedded
    ? "glass flex flex-col h-full overflow-hidden"
    : "flex flex-col h-full rounded-2xl bg-white/20 backdrop-blur-3xl border border-white/30 shadow-[0_16px_64px_rgba(46,148,190,0.15)] overflow-hidden";

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-separator/50 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2e94be] to-[#6aafc8] flex items-center justify-center shadow-sm">
            <Zap size={14} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-tight">Jarvis</p>
            <p className="text-[10px] text-fg-tertiary">Produktivitetsassistent</p>
          </div>
        </div>
        {!embedded && (
          <div className="flex items-center gap-1">
            {onToggleExpand && (
              <button onClick={onToggleExpand} className="btn-ghost p-1.5 rounded-lg" aria-label={isExpanded ? "Minimera chatt" : "Expandera chatt"}>
                {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
            )}
            {onClose && (
              <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg" aria-label="Stäng AI-assistent">
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`flex gap-2 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                msg.role === "assistant"
                  ? "bg-gradient-to-br from-[#2e94be] to-[#6aafc8]"
                  : "bg-foreground/10"
              }`}>
                {msg.role === "assistant" ? <Bot size={12} className="text-white" /> : <User size={12} className="text-fg-secondary" />}
              </div>
              <div className={`px-3 py-2 rounded-xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-accent/15 text-foreground"
                  : "bg-surface-elevated/60 text-foreground/90"
              }`}>
                {msg.content.split("\n").map((line, i) => (
                  <p key={i} className={i > 0 ? "mt-1" : ""}>
                    {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
                      part.startsWith("**") && part.endsWith("**")
                        ? <strong key={j} className="font-semibold text-accent">{part.slice(2, -2)}</strong>
                        : <span key={j}>{part}</span>
                    )}
                  </p>
                ))}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#2e94be] to-[#6aafc8] flex items-center justify-center">
              <Bot size={12} className="text-white" />
            </div>
            <div className="px-3 py-2.5 rounded-xl bg-surface-elevated/60 flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent/40 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-accent/40 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-accent/40 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="px-4 pb-2 flex gap-1.5 flex-wrap shrink-0">
        {["Sammanfattning", "Tips", "Uppgifter"].map((q) => (
          <button
            key={q}
            onClick={() => { setInput(q); setTimeout(() => handleSend(), 50); }}
            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-accent-subtle text-accent hover:bg-accent/15 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 pb-3 shrink-0">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="input-base flex-1 !py-2.5"
            placeholder="Fråga Jarvis..."
            aria-label="Meddelande till Jarvis"
          />
          <button type="submit" disabled={!input.trim()} className="btn-primary !p-2.5 !rounded-xl disabled:opacity-30">
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}

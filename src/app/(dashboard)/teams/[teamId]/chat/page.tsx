"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import GlassCard from "@/components/GlassCard";
import { Send, Loader2, ArrowLeft, MessageSquare } from "lucide-react";

interface Profile {
  id: string;
  name: string;
  avatar_url?: string;
}

interface ChatMessage {
  id: string;
  content: string;
  user_id: string;
  team_id: string;
  created_at: string;
  profile: Profile;
}

interface CurrentUser {
  id: string;
  name: string;
  email: string;
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 10) return "just nu";
  if (diffSec < 60) return `${diffSec} sek sedan`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min sedan`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} tim sedan`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return "igår";
  if (diffDay < 7) return `${diffDay} dagar sedan`;
  return new Date(dateStr).toLocaleDateString("sv-SE");
}

function renderMessageContent(content: string): React.ReactNode {
  const parts = content.split(/(@\w+)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^@\w+$/.test(part) ? (
          <span key={i} className="text-accent font-semibold">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export default function TeamChatPage() {
  const params = useParams();
  const teamId = params.teamId as string;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [teamName, setTeamName] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  // Fetch current user profile
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data);
        }
      } catch {
        /* silent */
      }
    }
    fetchProfile();
  }, []);

  // Fetch team name
  useEffect(() => {
    if (!teamId) return;
    async function fetchTeam() {
      try {
        const res = await fetch(`/api/teams/${teamId}`);
        if (res.ok) {
          const data = await res.json();
          setTeamName(data.name || "");
        }
      } catch {
        /* silent */
      }
    }
    fetchTeam();
  }, [teamId]);

  const fetchMessages = useCallback(async () => {
    if (!teamId) return;
    try {
      const res = await fetch(`/api/teams/${teamId}/chat`);
      if (!res.ok) throw new Error("Kunde inte ladda meddelanden");
      const data = await res.json();
      const msgs = Array.isArray(data) ? data : data.messages ?? [];
      setMessages(msgs);
      setError(null);
    } catch (err) {
      if (loading) setError(err instanceof Error ? err.message : "Fel vid laddning");
    } finally {
      setLoading(false);
    }
  }, [teamId, loading]);

  // Initial fetch + polling
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (messages.length > prevCountRef.current) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
    prevCountRef.current = messages.length;
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || !currentUser) return;

    const optimistic: ChatMessage = {
      id: `temp-${Date.now()}`,
      content: text,
      user_id: currentUser.id,
      team_id: teamId,
      created_at: new Date().toISOString(),
      profile: { id: currentUser.id, name: currentUser.name },
    };

    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch(`/api/teams/${teamId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) {
        const saved = await res.json();
        setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? saved : m)));
      }
    } catch {
      /* keep optimistic message */
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link href={`/teams/${teamId}/dashboard`} className="btn-ghost !p-2">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground tracking-tight">Teamchatt</h1>
          {teamName && (
            <p className="text-xs text-fg-tertiary mt-0.5">{teamName}</p>
          )}
        </div>
        <MessageSquare size={18} className="text-accent shrink-0" />
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Messages */}
      <GlassCard className="flex-1 !p-0 overflow-hidden flex flex-col" hover3d={false}>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && messages.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-accent" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <MessageSquare size={32} className="text-fg-tertiary opacity-40" />
              <p className="text-sm text-fg-tertiary">
                Inga meddelanden ännu. Skriv det första!
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = currentUser ? msg.user_id === currentUser.id : false;
              const senderName = msg.profile?.name || "Okänd";
              const initial = senderName.charAt(0).toUpperCase();

              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isOwn ? "flex-row-reverse" : ""}`}
                >
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                    <span className="text-[11px] font-bold text-accent">{initial}</span>
                  </div>
                  <div
                    className={`max-w-[70%] px-3.5 py-2.5 rounded-2xl ${
                      isOwn
                        ? "bg-accent/20 rounded-tr-sm"
                        : "glass rounded-tl-sm"
                    }`}
                  >
                    {!isOwn && (
                      <p className="text-[11px] font-semibold text-accent mb-0.5">
                        {senderName}
                      </p>
                    )}
                    <p className="text-sm text-foreground leading-relaxed">
                      {renderMessageContent(msg.content)}
                    </p>
                    <p
                      className={`text-[10px] text-fg-tertiary mt-1 ${
                        isOwn ? "text-right" : "text-left"
                      }`}
                    >
                      {relativeTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input bar */}
        <div className="border-t border-white/[0.06] p-3 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            className="input-base flex-1"
            placeholder="Skriv ett meddelande..."
            disabled={sending || !currentUser}
          />
          <button
            onClick={sendMessage}
            disabled={sending || !input.trim() || !currentUser}
            className="btn-primary !py-2 !px-3 disabled:opacity-40"
          >
            {sending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import GlassCard from "@/components/GlassCard";
import {
  MessageSquare,
  CheckSquare,
  FileText,
  Users,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  LayoutDashboard,
  UserPlus,
  Crown,
  User,
  Link2,
  Copy,
  Check,
  Trash2,
  AlertTriangle,
} from "lucide-react";

interface Profile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profile: Profile;
}

interface TeamData {
  id: string;
  name: string;
  description?: string;
  members: TeamMember[];
  currentUserRole: string;
}

export default function TeamDashboardPage() {
  const params = useParams();
  const teamId = params.teamId as string;

  const [team, setTeam] = useState<TeamData | null>(null);
  const [todosCount, setTodosCount] = useState(0);
  const [notesCount, setNotesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchData = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    try {
      const [teamRes, todosRes, notesRes] = await Promise.all([
        fetch(`/api/teams/${teamId}`),
        fetch(`/api/teams/${teamId}/todos`),
        fetch(`/api/teams/${teamId}/notes`),
      ]);

      if (!teamRes.ok) throw new Error("Kunde inte ladda teamdata");
      const teamData = await teamRes.json();
      setTeam(teamData);

      if (todosRes.ok) {
        const todos = await todosRes.json();
        setTodosCount(Array.isArray(todos) ? todos.length : 0);
      }
      if (notesRes.ok) {
        const notes = await notesRes.json();
        setNotesCount(Array.isArray(notes) ? notes.length : 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ett oväntat fel uppstod");
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    const email = inviteEmail.trim();
    if (!email) return;

    setInviting(true);
    setInviteMsg(null);
    try {
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteMsg({ type: "error", text: data.error || "Kunde inte bjuda in användaren" });
      } else {
        setInviteMsg({ type: "success", text: "Medlem inbjuden!" });
        setInviteEmail("");
        fetchData();
      }
    } catch {
      setInviteMsg({ type: "error", text: "Nätverksfel. Försök igen." });
    } finally {
      setInviting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 size={28} className="animate-spin text-accent" />
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <AlertCircle size={32} className="text-red-400" />
        <p className="text-fg-secondary text-sm">{error || "Teamet hittades inte"}</p>
        <Link href="/teams" className="btn-ghost text-sm mt-2">
          Tillbaka till team
        </Link>
      </div>
    );
  }

  const base = `/teams/${teamId}`;

  const navCards = [
    {
      href: `${base}/chat`,
      label: "Chatt",
      icon: MessageSquare,
      desc: "Realtidskommunikation med teamet",
    },
    {
      href: `${base}/todos`,
      label: "Uppgifter",
      icon: CheckSquare,
      desc: "Hantera delade uppgifter",
    },
    {
      href: `${base}/notes`,
      label: "Anteckningar",
      icon: FileText,
      desc: "Gemensamma anteckningar",
    },
    {
      href: `${base}/kanban`,
      label: "Kanban",
      icon: LayoutDashboard,
      desc: "Visuell arbetsflödestavla",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back link */}
      <Link
        href="/teams"
        className="inline-flex items-center gap-1.5 text-sm text-fg-secondary hover:text-accent transition-colors mb-6"
      >
        <ArrowLeft size={14} />
        Tillbaka
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {team.name}
        </h1>
        {team.description && (
          <p className="text-sm text-fg-tertiary mt-1">{team.description}</p>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <GlassCard className="!p-4 text-center" hover3d={false}>
          <Users size={18} className="mx-auto text-accent mb-1.5" />
          <p className="text-xl font-bold text-foreground">{team.members.length}</p>
          <p className="text-[11px] text-fg-tertiary uppercase tracking-wide">Medlemmar</p>
        </GlassCard>
        <GlassCard className="!p-4 text-center" hover3d={false}>
          <CheckSquare size={18} className="mx-auto text-accent mb-1.5" />
          <p className="text-xl font-bold text-foreground">{todosCount}</p>
          <p className="text-[11px] text-fg-tertiary uppercase tracking-wide">Uppgifter</p>
        </GlassCard>
        <GlassCard className="!p-4 text-center" hover3d={false}>
          <FileText size={18} className="mx-auto text-accent mb-1.5" />
          <p className="text-xl font-bold text-foreground">{notesCount}</p>
          <p className="text-[11px] text-fg-tertiary uppercase tracking-wide">Anteckningar</p>
        </GlassCard>
      </div>

      {/* Navigation cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {navCards.map((card) => (
          <Link key={card.href} href={card.href}>
            <GlassCard className="!p-5 hover:scale-[1.02] transition-transform cursor-pointer group flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
                <card.icon size={20} className="text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">{card.label}</p>
                  <ArrowRight
                    size={14}
                    className="text-fg-tertiary group-hover:text-accent group-hover:translate-x-0.5 transition-all"
                  />
                </div>
                <p className="text-xs text-fg-tertiary mt-0.5">{card.desc}</p>
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>

      {/* Members section */}
      <GlassCard className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Users size={16} className="text-accent" />
            Medlemmar
          </h2>
          <span className="badge text-[10px]">{team.members.length} st</span>
        </div>
        <div className="space-y-2">
          {team.members.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.04]"
            >
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-semibold text-accent">
                  {(m.profile?.name || m.profile?.email || "?").charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {m.profile?.name || m.profile?.email || "Okänd"}
                </p>
                {m.profile?.email && m.profile?.name && (
                  <p className="text-[11px] text-fg-tertiary truncate">{m.profile.email}</p>
                )}
              </div>
              <span
                className={`badge text-[10px] flex items-center gap-1 ${
                  m.role === "owner" ? "!bg-accent/20 !text-accent" : ""
                }`}
              >
                {m.role === "owner" ? (
                  <>
                    <Crown size={10} />
                    Agare
                  </>
                ) : (
                  <>
                    <User size={10} />
                    Medlem
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Invite member form */}
      <GlassCard>
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
          <UserPlus size={16} className="text-accent" />
          Bjud in medlem
        </h2>
        <form onSubmit={handleInvite} className="flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="input-base flex-1"
            placeholder="E-postadress..."
            disabled={inviting}
            required
          />
          <button type="submit" disabled={inviting || !inviteEmail.trim()} className="btn-primary whitespace-nowrap">
            {inviting ? <Loader2 size={14} className="animate-spin" /> : "Bjud in"}
          </button>
        </form>
        {inviteMsg && (
          <p
            className={`text-xs mt-2 ${
              inviteMsg.type === "success" ? "text-green-400" : "text-red-400"
            }`}
          >
            {inviteMsg.text}
          </p>
        )}
      </GlassCard>

      {/* Invite link generator */}
      <InviteLinkSection teamId={teamId} />

      {/* Delete team — owner only */}
      {team.currentUserRole === "owner" && (
        <DeleteTeamSection teamId={teamId} teamName={team.name} />
      )}
    </div>
  );
}

function InviteLinkSection({ teamId }: { teamId: string }) {
  const [inviteUrl, setInviteUrl] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generateLink() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        setInviteUrl(data.invite_url);
      }
    } catch {}
    setGenerating(false);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <GlassCard hover3d={false}>
      <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
        <Link2 size={16} className="text-accent" />
        Inbjudningslänk
      </h2>
      <p className="text-xs text-fg-tertiary mb-3">
        Skapa en länk som du kan skicka via email, Slack eller annat. Personen kan registrera sig och kopplas direkt till teamet.
      </p>

      {inviteUrl ? (
        <div className="flex gap-2">
          <input type="text" value={inviteUrl} readOnly className="input-base flex-1 text-xs font-mono" />
          <button onClick={copyLink} className="btn-primary flex items-center gap-1.5 whitespace-nowrap">
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Kopierad!" : "Kopiera"}
          </button>
        </div>
      ) : (
        <button onClick={generateLink} disabled={generating} className="btn-primary flex items-center gap-2">
          {generating ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
          {generating ? "Skapar..." : "Skapa inbjudningslänk"}
        </button>
      )}

      <p className="text-[10px] text-fg-tertiary mt-2">Länken är giltig i 7 dagar och kan användas en gång.</p>
    </GlassCard>
  );
}

function DeleteTeamSection({ teamId, teamName }: { teamId: string; teamName: string }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/teams/${teamId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/teams");
      }
    } catch {}
    setDeleting(false);
  }

  return (
    <>
      <div className="glass p-5 border-red-500/10" style={{ borderColor: "rgba(220,70,70,0.15)" }}>
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
          <Trash2 size={15} className="text-red-400" />
          Radera team
        </h2>
        <p className="text-xs text-fg-tertiary mb-3">
          Detta raderar teamet permanent, inklusive alla meddelanden, uppgifter och anteckningar. Kan inte ångras.
        </p>
        <button
          onClick={() => setShowConfirm(true)}
          className="px-4 py-2 rounded-xl text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"
        >
          Radera {teamName}
        </button>
      </div>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
          <div className="relative glass p-6 max-w-sm w-full animate-in text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} className="text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Radera team?</h3>
            <p className="text-sm text-fg-secondary mb-4">
              Skriv <strong className="text-foreground">{teamName}</strong> för att bekräfta.
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="input-base w-full mb-4 text-center"
              placeholder={teamName}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowConfirm(false); setConfirmText(""); }}
                className="btn-ghost flex-1 py-2.5 rounded-xl text-sm"
              >
                Avbryt
              </button>
              <button
                onClick={handleDelete}
                disabled={confirmText !== teamName || deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                {deleting ? "Raderar..." : "Radera permanent"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

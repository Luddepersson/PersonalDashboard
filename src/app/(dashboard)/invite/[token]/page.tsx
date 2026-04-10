"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Users, CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react";

interface InviteData {
  id: string;
  token: string;
  team_id: string;
  email: string | null;
  team: { id: string; name: string; slug: string };
}

export default function InvitePage() {
  const params = useParams();
  const token = params.token as string;
  const router = useRouter();

  const [invite, setInvite] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchInvite() {
      try {
        const res = await fetch(`/api/invites/${token}`);
        if (res.ok) {
          setInvite(await res.json());
        } else {
          const data = await res.json();
          setError(data.error || "Ogiltig inbjudan");
        }
      } catch {
        setError("Kunde inte ladda inbjudan");
      }
      setLoading(false);
    }
    fetchInvite();
  }, [token]);

  async function acceptInvite() {
    setAccepting(true);
    setError("");
    try {
      const res = await fetch(`/api/invites/${token}`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push(`/teams/${data.team_id}/dashboard`), 1500);
      } else if (res.status === 409) {
        // Already member — redirect
        router.push(`/teams/${data.team_id}/dashboard`);
      } else {
        setError(data.error || "Något gick fel");
      }
    } catch {
      setError("Något gick fel");
    }
    setAccepting(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={28} className="animate-spin text-accent" />
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="glass p-8 text-center max-w-sm">
          <XCircle size={40} className="text-accent-warm mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">Ogiltig inbjudan</h2>
          <p className="text-sm text-fg-secondary mb-4">{error}</p>
          <button onClick={() => router.push("/teams")} className="btn-primary">
            Gå till Teams
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="glass p-8 text-center max-w-sm animate-in">
          <CheckCircle size={40} className="text-green-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">Välkommen!</h2>
          <p className="text-sm text-fg-secondary">Du är nu medlem i <strong>{invite?.team?.name}</strong>. Omdirigerar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="glass p-8 text-center max-w-sm animate-in">
        <div className="w-16 h-16 rounded-2xl bg-accent-subtle flex items-center justify-center mx-auto mb-5">
          <Users size={28} className="text-accent" />
        </div>

        <h2 className="text-xl font-semibold text-foreground mb-2">Team-inbjudan</h2>
        <p className="text-sm text-fg-secondary mb-6">
          Du har blivit inbjuden till
        </p>

        <div className="glass !p-4 mb-6">
          <p className="text-lg font-bold text-foreground">{invite?.team?.name}</p>
        </div>

        {error && <p className="text-sm text-accent-warm mb-4">{error}</p>}

        <button
          onClick={acceptInvite}
          disabled={accepting}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {accepting ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
          {accepting ? "Går med..." : "Gå med i teamet"}
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import { User, Mail, Palette, Save, GitBranch } from "lucide-react";
import GlassCard from "@/components/GlassCard";

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [theme, setTheme] = useState("light");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, theme, github_username")
        .eq("id", user.id)
        .single();

      if (profile) {
        setName(profile.name || "");
        setTheme(profile.theme || "light");
        setGithubUsername(profile.github_username || "");
      }
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ name, theme, github_username: githubUsername, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (!error) {
      document.documentElement.setAttribute("data-theme", theme);
      setMessage("Sparat!");
    } else {
      setMessage("Något gick fel");
    }
    setSaving(false);
    setTimeout(() => setMessage(""), 3000);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Profil</h1>
        <p className="text-sm text-fg-secondary mt-0.5">Hantera dina kontoinställningar</p>
      </div>
      <div className="max-w-lg">
        <GlassCard hover3d={false}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-1.5">
                <User size={15} /> Namn
              </label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-base w-full" placeholder="Ditt namn" />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-1.5">
                <Mail size={15} /> E-post
              </label>
              <input type="email" value={email} readOnly className="input-base w-full opacity-60 cursor-not-allowed" />
              <p className="text-xs text-fg-tertiary mt-1">Kan inte ändras</p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-1.5">
                <GitBranch size={15} /> GitHub-användarnamn
              </label>
              <input type="text" value={githubUsername} onChange={(e) => setGithubUsername(e.target.value)} className="input-base w-full" placeholder="ditt-github-namn" />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-1.5">
                <Palette size={15} /> Tema
              </label>
              <select value={theme} onChange={(e) => setTheme(e.target.value)} className="input-base w-full">
                <option value="emerald-chrome">Emerald Chrome</option>
                <option value="navy-mirage">Navy Mirage</option>
                <option value="midnight-gold">Midnight Gold</option>
                <option value="royal-aurora">Royal Aurora</option>
                <option value="obsidian-plum">Obsidian Plum</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                <Save size={15} />
                {saving ? "Sparar..." : "Spara"}
              </button>
              {message && <p className="text-sm text-fg-secondary">{message}</p>}
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}

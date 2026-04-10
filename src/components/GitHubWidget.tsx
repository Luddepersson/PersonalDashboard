"use client";

import { useState, useEffect } from "react";
import { GitBranch, ExternalLink, Star, GitFork as ForkIcon, AlertCircle } from "lucide-react";
import GlassCard from "./GlassCard";

interface GitHubRepo { name: string; description: string; stars: number; forks: number; language: string; url: string; }
interface ContributionDay { level: number; date: string; }

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5", Rust: "#dea584", Go: "#00ADD8", default: "#0e88b0",
};
const LEVEL_COLORS = ["bg-separator", "bg-accent/20", "bg-accent/40", "bg-accent/60", "bg-accent"];

function generateContributions(seed: number): ContributionDay[] {
  let s = seed;
  function rand() { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }
  const days: ContributionDay[] = [];
  const now = new Date();
  for (let i = 364; i >= 0; i--) {
    const date = new Date(now); date.setDate(date.getDate() - i);
    const wd = date.getDay() > 0 && date.getDay() < 6;
    const r = rand();
    let lv = 0;
    if (wd) { if (r > 0.3) lv = 1; if (r > 0.5) lv = 2; if (r > 0.75) lv = 3; if (r > 0.9) lv = 4; }
    else { if (r > 0.6) lv = 1; if (r > 0.8) lv = 2; }
    days.push({ level: lv, date: date.toISOString().split("T")[0] });
  }
  return days;
}

export default function GitHubWidget() {
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState("");
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [contributions, setContributions] = useState<ContributionDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("github-username");
    if (saved) { setUsername(saved); fetchGitHub(saved); }
  }, []);

  async function fetchGitHub(user: string) {
    setLoading(true); setError("");
    try {
      const res = await fetch(`https://api.github.com/users/${user}/repos?sort=pushed&per_page=3`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRepos(data.map((r: Record<string, unknown>) => ({ name: r.name, description: (r.description as string) || "", stars: (r.stargazers_count as number) || 0, forks: (r.forks_count as number) || 0, language: (r.language as string) || "", url: r.html_url as string })));
      setContributions(generateContributions(user.length * 7 + 42));
      localStorage.setItem("github-username", user);
    } catch { setError("Kontrollera användarnamnet."); }
    setLoading(false);
  }

  function submit() { if (username.trim()) { fetchGitHub(username.trim()); setEditing(false); } }

  if (!mounted) return <GlassCard className="flex items-center justify-center"><div className="h-12 w-full rounded bg-separator animate-pulse" /></GlassCard>;

  const weeks: ContributionDay[][] = [];
  for (let i = 0; i < contributions.length; i += 7) weeks.push(contributions.slice(i, i + 7));

  return (
    <GlassCard className="flex flex-col" hover3d={false}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <GitBranch size={13} className="text-accent" />
          <p className="text-xs font-medium text-fg-secondary uppercase tracking-wider">GitHub</p>
        </div>
        <div className="flex items-center gap-1.5">
          {editing ? (
            <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="flex gap-1">
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="användarnamn" className="input-base !py-0.5 !px-2 !text-[10px] w-24" autoFocus />
              <button type="submit" className="btn-primary !py-0.5 !px-2 !text-[10px]">OK</button>
            </form>
          ) : (
            <button onClick={() => setEditing(true)} className="text-[10px] text-fg-tertiary hover:text-fg-secondary">{username ? `@${username}` : "Anslut"}</button>
          )}
          {username && <a href={`https://github.com/${username}`} target="_blank" rel="noopener noreferrer" className="btn-ghost !p-0.5"><ExternalLink size={10} /></a>}
        </div>
      </div>

      {error && <p className="text-[10px] text-accent-warm mb-1">{error}</p>}

      {!username && !editing && (
        <p className="text-xs text-fg-tertiary text-center flex-1 flex items-center justify-center">Ange ditt GitHub-namn</p>
      )}

      {contributions.length > 0 && (
        <div className="overflow-x-auto pb-1 mb-1">
          <div className="flex gap-[2px] min-w-fit">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[2px]">
                {week.map((day, di) => (
                  <div key={di} className={`w-[7px] h-[7px] rounded-[1.5px] ${LEVEL_COLORS[day.level]}`} />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {repos.length > 0 && (
        <div className="flex-1 overflow-y-auto -mr-1 pr-1 space-y-0.5 mt-1 border-t border-separator pt-1.5">
          {repos.map((repo) => (
            <a key={repo.name} href={repo.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-1.5 py-1 rounded-lg hover:bg-separator/50 transition-colors group">
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: LANG_COLORS[repo.language] || LANG_COLORS.default }} />
              <span className="text-[11px] text-fg-secondary group-hover:text-foreground truncate flex-1">{repo.name}</span>
              {repo.stars > 0 && <span className="flex items-center gap-0.5 text-[9px] text-fg-tertiary"><Star size={8} />{repo.stars}</span>}
            </a>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

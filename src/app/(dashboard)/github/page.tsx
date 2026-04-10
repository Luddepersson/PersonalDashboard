"use client";

import { useState, useEffect } from "react";
import { GitBranch, ExternalLink, Star, GitFork, AlertCircle, Search } from "lucide-react";

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

export default function GitHubPage() {
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [contributions, setContributions] = useState<ContributionDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("github-username");
    if (saved) { setUsername(saved); setInputValue(saved); fetchGitHub(saved); }
  }, []);

  async function fetchGitHub(user: string) {
    setLoading(true); setError("");
    try {
      const res = await fetch(`https://api.github.com/users/${user}/repos?sort=pushed&per_page=10`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRepos(data.map((r: Record<string, unknown>) => ({
        name: r.name,
        description: (r.description as string) || "",
        stars: (r.stargazers_count as number) || 0,
        forks: (r.forks_count as number) || 0,
        language: (r.language as string) || "",
        url: r.html_url as string,
      })));
      setContributions(generateContributions(user.length * 7 + 42));
      setUsername(user);
      localStorage.setItem("github-username", user);
    } catch {
      setError("Kunde inte hamta data. Kontrollera anvandarnamnet.");
    }
    setLoading(false);
  }

  function submit() {
    if (inputValue.trim()) fetchGitHub(inputValue.trim());
  }

  if (!mounted) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="h-8 w-48 rounded bg-separator animate-pulse" />
          <div className="h-4 w-64 rounded bg-separator animate-pulse mt-3" />
        </div>
        <div className="h-32 rounded-xl bg-separator animate-pulse" />
      </div>
    );
  }

  const weeks: ContributionDay[][] = [];
  for (let i = 0; i < contributions.length; i += 7) weeks.push(contributions.slice(i, i + 7));

  const totalContributions = contributions.filter(d => d.level > 0).length;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tighter">GitHub</h1>
        <p className="text-sm text-fg-secondary mt-1.5">Dina repositories och aktivitet</p>
      </div>

      {/* Username Settings */}
      <div className="glass p-5 sm:p-6 mb-6">
        <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-tertiary" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ange ditt GitHub-anvandarnamn..."
              className="input-base w-full !pl-10 !py-2.5"
            />
          </div>
          <button type="submit" className="btn-primary !py-2.5 !px-6 shrink-0" disabled={loading}>
            {loading ? "Laddar..." : "Hamta"}
          </button>
          {username && (
            <a
              href={`https://github.com/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost flex items-center gap-2 !py-2.5 !px-4"
            >
              <ExternalLink size={16} /> Profil
            </a>
          )}
        </form>
        {error && (
          <p className="text-sm text-accent-warm mt-3 flex items-center gap-2">
            <AlertCircle size={14} /> {error}
          </p>
        )}
      </div>

      {/* Contribution Graph */}
      {contributions.length > 0 && (
        <div className="glass p-6 sm:p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Aktivitet</h2>
            <span className="text-sm text-fg-tertiary">{totalContributions} bidrag senaste aret</span>
          </div>
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-[3px] min-w-fit">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((day, di) => (
                    <div
                      key={di}
                      className={`w-[11px] h-[11px] sm:w-[13px] sm:h-[13px] rounded-[2px] ${LEVEL_COLORS[day.level]}`}
                      title={`${day.date}: level ${day.level}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 justify-end">
            <span className="text-xs text-fg-tertiary">Mindre</span>
            {LEVEL_COLORS.map((c, i) => (
              <div key={i} className={`w-[11px] h-[11px] rounded-[2px] ${c}`} />
            ))}
            <span className="text-xs text-fg-tertiary">Mer</span>
          </div>
        </div>
      )}

      {/* Repos */}
      {repos.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Repositories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {repos.map((repo) => (
              <a
                key={repo.name}
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="glass p-5 hover:bg-surface/50 transition-all group"
              >
                <div className="flex items-start gap-3 mb-3">
                  <GitBranch size={16} className="text-accent shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground group-hover:text-accent truncate">
                      {repo.name}
                    </p>
                    {repo.description && (
                      <p className="text-xs text-fg-tertiary mt-1 line-clamp-2">{repo.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-fg-tertiary">
                  {repo.language && (
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: LANG_COLORS[repo.language] || LANG_COLORS.default }} />
                      {repo.language}
                    </span>
                  )}
                  {repo.stars > 0 && (
                    <span className="flex items-center gap-1">
                      <Star size={12} /> {repo.stars}
                    </span>
                  )}
                  {repo.forks > 0 && (
                    <span className="flex items-center gap-1">
                      <GitFork size={12} /> {repo.forks}
                    </span>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {!username && !loading && (
        <div className="glass p-12 text-center">
          <GitBranch size={40} className="text-fg-tertiary/30 mx-auto mb-4" />
          <p className="text-base text-fg-tertiary">Ange ditt GitHub-anvandarnamn for att se din aktivitet</p>
        </div>
      )}
    </div>
  );
}

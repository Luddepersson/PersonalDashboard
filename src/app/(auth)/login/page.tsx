"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError("Fel e-post eller lösenord"); setLoading(false); }
    else { router.push("/dashboard"); router.refresh(); }
  }

  const inputCls = "w-full px-4 py-3 rounded-xl border border-white/40 text-[#0f1c2e] text-sm bg-white/30 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-[#2e94be]/25 focus:border-[#2e94be]/50 focus:bg-white/40 transition-all placeholder:text-[#0f1c2e]/25";

  return (
    <div className="backdrop-blur-3xl bg-white/25 rounded-2xl sm:rounded-3xl border border-white/40 shadow-[0_16px_64px_rgba(46,148,190,0.1),inset_0_1px_0_rgba(255,255,255,0.4)] p-5 sm:p-9">
      <div className="text-center mb-6 sm:mb-9">
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#2e94be] via-[#4cb4d8] to-[#6aafc8] flex items-center justify-center mx-auto mb-3 sm:mb-5 shadow-[0_8px_30px_rgba(46,148,190,0.3)]">
          <span className="text-white font-bold text-lg sm:text-2xl tracking-tight">PD</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-[#0f1c2e] tracking-tight">Välkommen tillbaka</h1>
        <p className="text-xs sm:text-sm text-[#0f1c2e]/40 mt-1 sm:mt-1.5">Logga in för att fortsätta</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="text-sm text-red-600 bg-red-50/60 backdrop-blur rounded-xl px-4 py-2.5 text-center border border-red-200/30">{error}</div>}
        <div>
          <label className="block text-[10px] font-semibold text-[#0f1c2e]/45 mb-1.5 uppercase tracking-[0.1em]">E-post</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="din@email.se" required />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-[#0f1c2e]/45 mb-1.5 uppercase tracking-[0.1em]">Lösenord</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} placeholder="••••••••" required />
        </div>
        <button type="submit" disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#2e94be] to-[#6aafc8] text-white text-sm font-medium shadow-[0_6px_25px_rgba(46,148,190,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] hover:shadow-[0_8px_35px_rgba(46,148,190,0.4)] disabled:opacity-50 transition-all hover:-translate-y-0.5 active:translate-y-0">
          {loading ? "Loggar in..." : "Logga in"}
        </button>
      </form>

      <div className="mt-5 sm:mt-7 pt-4 sm:pt-5 border-t border-white/20">
        <p className="text-center text-sm text-[#0f1c2e]/35">
          Inget konto?{" "}
          <Link href="/register" className="text-[#2e94be] font-medium hover:text-[#2480a6] transition-colors">Skapa konto</Link>
        </p>
      </div>
    </div>
  );
}

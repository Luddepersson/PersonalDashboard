"use client";
import MovieWidget from "@/components/movies/MovieWidget";

export default function MoviesPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tighter">Film & Serier</h1>
        <p className="text-sm text-fg-secondary mt-1.5">Hall koll pa vad du tittar pa</p>
      </div>
      <MovieWidget />
    </div>
  );
}

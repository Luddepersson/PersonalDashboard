"use client";
import GoalsWidget from "@/components/goals/GoalsWidget";

export default function GoalsPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tighter">Mal</h1>
        <p className="text-sm text-fg-secondary mt-1.5">Satt och folj upp dina mal</p>
      </div>
      <GoalsWidget />
    </div>
  );
}

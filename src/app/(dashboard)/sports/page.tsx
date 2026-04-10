"use client";
import SportsCalWidget from "@/components/sportscal/SportsCalWidget";

export default function SportsPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Sportkalender</h1>
        <p className="text-sm text-fg-secondary mt-1">Kommande matcher för dina lag</p>
      </div>
      <div className="glass p-6 sm:p-8 [&_.glass]:shadow-none [&_.glass]:border-0 [&_.glass]:bg-transparent [&_.glass]:p-0 [&_.glass]:backdrop-blur-none">
        <SportsCalWidget />
      </div>
    </div>
  );
}

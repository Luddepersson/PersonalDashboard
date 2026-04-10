"use client";
import CountdownWidget from "@/components/countdown/CountdownWidget";

export default function CountdownPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tighter">Nedrakning</h1>
        <p className="text-sm text-fg-secondary mt-1.5">Rakna ner till viktiga datum</p>
      </div>
      <CountdownWidget />
    </div>
  );
}

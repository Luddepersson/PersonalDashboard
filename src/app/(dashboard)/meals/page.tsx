"use client";
import MealPrepWidget from "@/components/meals/MealPrepWidget";

export default function MealsPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tighter">Maltidsplanering</h1>
        <p className="text-sm text-fg-secondary mt-1.5">Planera veckans maltider</p>
      </div>
      <MealPrepWidget />
    </div>
  );
}

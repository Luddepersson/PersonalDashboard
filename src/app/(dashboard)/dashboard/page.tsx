import { createServerSupabase } from "@/lib/supabase-server";
import DashboardOverview from "./DashboardOverview";

export default async function DashboardPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  let name = "där";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single();
    if (profile?.name) name = profile.name;
  }

  const hour = new Date().getHours();
  let greeting = "Välkommen";
  if (hour < 5) greeting = "God natt";
  else if (hour < 12) greeting = "God morgon";
  else if (hour < 17) greeting = "God eftermiddag";
  else greeting = "God kväll";

  const now = new Date();
  const dateStr = now.toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div>
      {/* Header — like inspiration image */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-3xl font-bold text-foreground tracking-tighter">
          {greeting}, <span className="text-accent">{name}</span>
        </h1>
        <p className="text-xs sm:text-sm text-fg-secondary mt-1.5 sm:mt-2 capitalize">{dateStr}</p>
      </div>

      <DashboardOverview />
    </div>
  );
}

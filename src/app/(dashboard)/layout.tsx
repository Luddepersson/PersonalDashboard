import { createServerSupabase } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import QueryProvider from "@/providers/QueryProvider";
import DashboardShell from "./DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, theme")
    .eq("id", user.id)
    .single();

  return (
    <QueryProvider>
      <DashboardShell user={{ name: profile?.name || user.email, theme: profile?.theme || "light" }}>
        {children}
      </DashboardShell>
    </QueryProvider>
  );
}

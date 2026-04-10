import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { teamId } = await params;

  // Check membership
  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("team_id", teamId)
    .maybeSingle();

  if (!membership) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  // Get team
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .single();

  if (teamError || !team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  // Get members — fetch separately to avoid profile join issues
  const { data: members } = await supabase
    .from("team_members")
    .select("id, user_id, role, joined_at")
    .eq("team_id", teamId)
    .order("joined_at", { ascending: true });

  // Get profiles for each member
  const memberUserIds = (members || []).map((m) => m.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, avatar_url")
    .in("id", memberUserIds);

  const profileMap: Record<string, { name: string; avatar_url: string | null }> = {};
  (profiles || []).forEach((p: { id: string; name: string; avatar_url: string | null }) => {
    profileMap[p.id] = { name: p.name || "Okänd", avatar_url: p.avatar_url };
  });

  const membersWithProfiles = (members || []).map((m) => ({
    ...m,
    profile: {
      id: m.user_id,
      name: profileMap[m.user_id]?.name || "Okänd",
      avatar_url: profileMap[m.user_id]?.avatar_url || null,
    },
  }));

  return NextResponse.json({
    ...team,
    members: membersWithProfiles,
    currentUserRole: membership.role,
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { teamId } = await params;

  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("team_id", teamId)
    .maybeSingle();

  if (!membership || membership.role !== "owner")
    return NextResponse.json({ error: "Owner only" }, { status: 403 });

  const { error } = await supabase.from("teams").delete().eq("id", teamId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

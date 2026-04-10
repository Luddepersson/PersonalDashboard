import { NextResponse } from "next/server";
import { teamSchema } from "@/lib/validations";
import { createServerSupabase } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get all team IDs user is member of
  const { data: memberships, error } = await supabase
    .from("team_members")
    .select("team_id, role")
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!memberships || memberships.length === 0) return NextResponse.json([]);

  const teamIds = memberships.map((m) => m.team_id);

  // Fetch teams directly
  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("id, name, slug, created_at")
    .in("id", teamIds);

  if (teamsError) return NextResponse.json({ error: teamsError.message }, { status: 500 });

  // Get member counts
  const { data: allMembers } = await supabase
    .from("team_members")
    .select("team_id")
    .in("team_id", teamIds);

  const countMap: Record<string, number> = {};
  (allMembers || []).forEach((m: { team_id: string }) => {
    countMap[m.team_id] = (countMap[m.team_id] || 0) + 1;
  });

  const roleMap: Record<string, string> = {};
  memberships.forEach((m) => { roleMap[m.team_id] = m.role; });

  const result = (teams || []).map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    created_at: t.created_at,
    role: roleMap[t.id] || "member",
    member_count: countMap[t.id] || 0,
  }));

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = teamSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const slug = parsed.data.name
    .toLowerCase()
    .replace(/[^a-z0-9åäö]+/g, "-")
    .replace(/^-|-$/g, "") || "team";

  const { data: existing } = await supabase
    .from("teams")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug;

  // Atomic: create team + add owner in one DB function
  const { data: teamId, error: createError } = await supabase
    .rpc("create_team", { p_name: parsed.data.name, p_slug: finalSlug, p_user_id: user.id });

  if (createError) return NextResponse.json({ error: createError.message }, { status: 500 });

  return NextResponse.json(
    { id: teamId, name: parsed.data.name, slug: finalSlug, role: "owner", member_count: 1 },
    { status: 201 }
  );
}

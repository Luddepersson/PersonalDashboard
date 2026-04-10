import { NextResponse } from "next/server";
import { inviteSchema } from "@/lib/validations";
import { createServerSupabase } from "@/lib/supabase-server";


export async function GET(
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

  if (!membership)
    return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const { data: members, error } = await supabase
    .from("team_members")
    .select("*, profile:profiles(id, name, email, avatar_url)")
    .eq("team_id", teamId)
    .order("joined_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(members);
}

export async function POST(
  req: Request,
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

  if (!membership)
    return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const body = await req.json();
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data: userToInvite } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", parsed.data.email)
    .maybeSingle();

  if (!userToInvite)
    return NextResponse.json(
      { error: "Ingen användare med den e-posten hittades" },
      { status: 404 }
    );

  const { data: existingMember } = await supabase
    .from("team_members")
    .select("id")
    .eq("user_id", userToInvite.id)
    .eq("team_id", teamId)
    .maybeSingle();

  if (existingMember)
    return NextResponse.json(
      { error: "Användaren är redan medlem" },
      { status: 409 }
    );

  const { data: member, error } = await supabase
    .from("team_members")
    .insert({
      user_id: userToInvite.id,
      team_id: teamId,
      role: "member",
    })
    .select("*, profile:profiles(id, name, email, avatar_url)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(member, { status: 201 });
}

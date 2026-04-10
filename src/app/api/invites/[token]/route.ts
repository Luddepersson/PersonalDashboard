import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

// GET — get invite details (public, for the invite page)
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const supabase = await createServerSupabase();
  const { token } = await params;

  const { data: invite, error } = await supabase
    .from("team_invites")
    .select("*, team:teams(id, name, slug)")
    .eq("token", token)
    .maybeSingle();

  if (error || !invite) return NextResponse.json({ error: "Inbjudan hittades inte" }, { status: 404 });

  if (invite.used_at) return NextResponse.json({ error: "Inbjudan redan använd" }, { status: 410 });

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "Inbjudan har gått ut" }, { status: 410 });
  }

  return NextResponse.json(invite);
}

// POST — accept invite (authenticated user joins the team)
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Logga in först" }, { status: 401 });
  const { token } = await params;

  // Get invite
  const { data: invite } = await supabase
    .from("team_invites")
    .select("*, team:teams(id, name)")
    .eq("token", token)
    .maybeSingle();

  if (!invite) return NextResponse.json({ error: "Inbjudan hittades inte" }, { status: 404 });
  if (invite.used_at) return NextResponse.json({ error: "Redan använd" }, { status: 410 });
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "Utgången" }, { status: 410 });
  }

  // Check if already member
  const { data: existing } = await supabase
    .from("team_members")
    .select("id")
    .eq("team_id", invite.team_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) return NextResponse.json({ error: "Du är redan medlem", team_id: invite.team_id }, { status: 409 });

  // Add as member
  const { error: memberError } = await supabase
    .from("team_members")
    .insert({ team_id: invite.team_id, user_id: user.id, role: "member" });

  if (memberError) return NextResponse.json({ error: memberError.message }, { status: 500 });

  // Mark invite as used
  await supabase
    .from("team_invites")
    .update({ used_by: user.id, used_at: new Date().toISOString() })
    .eq("id", invite.id);

  return NextResponse.json({ success: true, team_id: invite.team_id, team_name: invite.team?.name });
}

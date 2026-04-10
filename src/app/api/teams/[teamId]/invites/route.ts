import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

import { randomBytes } from "crypto";

function generateToken() {
  return randomBytes(18).toString("base64url");
}

// GET — list invites for this team
export async function GET(req: Request, { params }: { params: Promise<{ teamId: string }> }) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { teamId } = await params;

  const { data, error } = await supabase
    .from("team_invites")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST — create invite (optionally with email)
export async function POST(req: Request, { params }: { params: Promise<{ teamId: string }> }) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { teamId } = await params;

  // Verify membership
  const { data: member } = await supabase
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member) return NextResponse.json({ error: "Inte medlem" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const token = generateToken();

  const { data, error } = await supabase
    .from("team_invites")
    .insert({
      team_id: teamId,
      email: body.email || null,
      token,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Build the invite URL
  const baseUrl = req.headers.get("origin") || "http://localhost:3001";
  const inviteUrl = `${baseUrl}/invite/${token}`;

  return NextResponse.json({ ...data, invite_url: inviteUrl });
}

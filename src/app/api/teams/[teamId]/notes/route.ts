import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function GET(req: Request, { params }: { params: Promise<{ teamId: string }> }) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { teamId } = await params;

  const { data: member } = await supabase.from("team_members").select("id").eq("team_id", teamId).eq("user_id", user.id).maybeSingle();
  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("team_id", teamId)
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request, { params }: { params: Promise<{ teamId: string }> }) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { teamId } = await params;

  const body = await req.json();
  const { data, error } = await supabase
    .from("notes")
    .insert({ title: body.title, content: body.content || "", user_id: user.id, team_id: teamId })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ teamId: string }> }) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { teamId } = await params;

  const { data: member } = await supabase.from("team_members").select("id").eq("team_id", teamId).eq("user_id", user.id).maybeSingle();
  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const body = await req.json();
  const { data, error } = await supabase
    .from("notes")
    .update({ title: body.title, content: body.content, updated_at: new Date().toISOString() })
    .eq("id", body.id)
    .eq("team_id", teamId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

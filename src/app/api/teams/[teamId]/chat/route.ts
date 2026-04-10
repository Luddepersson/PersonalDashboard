import { NextResponse } from "next/server";
import { chatMessageSchema } from "@/lib/validations";
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
    .from("team_members").select("role").eq("user_id", user.id).eq("team_id", teamId).maybeSingle();
  if (!membership) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  // Get messages
  const { data: messages, error } = await supabase
    .from("chat_messages")
    .select("id, content, user_id, team_id, created_at")
    .eq("team_id", teamId)
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get profiles for message senders
  const userIds = [...new Set((messages || []).map((m) => m.user_id))];
  const { data: profiles } = await supabase
    .from("profiles").select("id, name, avatar_url").in("id", userIds);

  const profileMap: Record<string, { id: string; name: string; avatar_url: string | null }> = {};
  (profiles || []).forEach((p: { id: string; name: string; avatar_url: string | null }) => {
    profileMap[p.id] = p;
  });

  const result = (messages || []).map((m) => ({
    ...m,
    profile: profileMap[m.user_id] || { id: m.user_id, name: "Okänd", avatar_url: null },
  }));

  return NextResponse.json(result);
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
    .from("team_members").select("role").eq("user_id", user.id).eq("team_id", teamId).maybeSingle();
  if (!membership) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const body = await req.json();
  const parsed = chatMessageSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data: message, error } = await supabase
    .from("chat_messages")
    .insert({ content: parsed.data.content, user_id: user.id, team_id: teamId })
    .select("id, content, user_id, team_id, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get sender profile
  const { data: profile } = await supabase
    .from("profiles").select("id, name, avatar_url").eq("id", user.id).single();

  return NextResponse.json(
    { ...message, profile: profile || { id: user.id, name: "Du", avatar_url: null } },
    { status: 201 }
  );
}

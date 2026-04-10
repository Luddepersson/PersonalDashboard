import { NextResponse } from "next/server";
import { profileUpdateSchema } from "@/lib/validations";
import { createServerSupabase } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, name, avatar_url, github_username, theme, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    id: user.id,
    name: profile?.name || null,
    email: user.email,
    avatar_url: profile?.avatar_url || null,
    github_username: profile?.github_username || null,
    theme: profile?.theme || "emerald-chrome",
  });
}

export async function PATCH(req: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.github_username !== undefined) updateData.github_username = parsed.data.github_username;
  if (parsed.data.theme !== undefined) updateData.theme = parsed.data.theme;
  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", user.id)
    .select("id, name, avatar_url, github_username, theme")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ...data, email: user.email });
}

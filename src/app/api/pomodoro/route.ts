import { NextResponse } from "next/server";
import { pomodoroSchema } from "@/lib/validations";
import { createServerSupabase } from "@/lib/supabase-server";


export async function GET() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: sessions, error: sessionsError } = await supabase
    .from("pomodoro_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("completed_at", { ascending: false });

  if (sessionsError) return NextResponse.json({ error: sessionsError.message }, { status: 500 });

  const { count, error: countError } = await supabase
    .from("pomodoro_sessions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });

  return NextResponse.json({ sessions, count });
}

export async function POST(req: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = pomodoroSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data, error } = await supabase
    .from("pomodoro_sessions")
    .insert({
      mode: parsed.data.mode,
      duration_min: parsed.data.duration_min,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

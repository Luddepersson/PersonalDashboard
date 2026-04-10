import { NextResponse } from "next/server";
import { habitSchema } from "@/lib/validations";
import { createServerSupabase } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: habits, error: habitsError } = await supabase
    .from("habits")
    .select("*, habit_completions(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (habitsError) return NextResponse.json({ error: habitsError.message }, { status: 500 });
  return NextResponse.json(habits);
}

export async function POST(req: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = habitSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data, error } = await supabase
    .from("habits")
    .insert({
      name: parsed.data.name,
      color: parsed.data.color,
      user_id: user.id,
    })
    .select("*, habit_completions(*)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

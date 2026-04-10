import { NextResponse } from "next/server";
import { completionSchema } from "@/lib/validations";
import { createServerSupabase } from "@/lib/supabase-server";


export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: habitId } = await params;

  const { data: habit } = await supabase
    .from("habits")
    .select("id, user_id")
    .eq("id", habitId)
    .single();

  if (!habit || habit.user_id !== user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = completionSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { date } = parsed.data;

  const { data: existing } = await supabase
    .from("habit_completions")
    .select("id")
    .eq("habit_id", habitId)
    .eq("date", date)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("habit_completions")
      .delete()
      .eq("id", existing.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ completed: false });
  }

  const { error } = await supabase
    .from("habit_completions")
    .insert({ habit_id: habitId, date });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ completed: true }, { status: 201 });
}

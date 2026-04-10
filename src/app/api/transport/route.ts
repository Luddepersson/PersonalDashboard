import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

// Store transport settings in user profile (we'll use a JSON column approach via the existing profiles table)
// We store: { stopName, stopId, trafiklabKey, alarmTime }

export async function GET() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Try to get from profile's transport_settings
  // Since we don't have a dedicated column, we use localStorage approach
  // But we can store in quick_links or create a settings pattern
  // Simplest: use a "settings" row in a generic key-value approach
  // For now: return from a custom "user_settings" approach using notes with a special title

  const { data } = await supabase
    .from("quick_links")
    .select("url")
    .eq("user_id", user.id)
    .eq("name", "__transport_settings__")
    .maybeSingle();

  if (data) {
    try { return NextResponse.json(JSON.parse(data.url)); } catch {}
  }
  return NextResponse.json({ stopName: "Centralstationen", stopId: null, trafiklabKey: null, alarmTime: null });
}

export async function PUT(req: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const settings = JSON.stringify({
    stopName: body.stopName || "Centralstationen",
    stopId: body.stopId || null,
    trafiklabKey: body.trafiklabKey || null,
    alarmTime: body.alarmTime || null,
  });

  // Upsert using quick_links with a special name
  const { data: existing } = await supabase
    .from("quick_links")
    .select("id")
    .eq("user_id", user.id)
    .eq("name", "__transport_settings__")
    .maybeSingle();

  if (existing) {
    await supabase.from("quick_links").update({ url: settings }).eq("id", existing.id);
  } else {
    await supabase.from("quick_links").insert({
      user_id: user.id,
      name: "__transport_settings__",
      url: settings,
      icon: "train",
      color: "#000",
    });
  }

  return NextResponse.json({ success: true });
}

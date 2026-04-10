import { NextResponse } from "next/server";

const RESROBOT_KEY = "837e1118-861d-49a2-a17b-56709aa8ad9a";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  if (!q || q.length < 2) return NextResponse.json([]);

  try {
    const res = await fetch(
      `https://api.resrobot.se/v2.1/location.name?input=${encodeURIComponent(q)}&format=json&accessId=${RESROBOT_KEY}&maxNo=6`
    );
    if (!res.ok) return NextResponse.json([]);
    const data = await res.json();
    const stops = (data?.stopLocationOrCoordLocation || [])
      .map((s: Record<string, unknown>) => {
        const stop = s.StopLocation as Record<string, string> | undefined;
        if (!stop) return null;
        return { id: stop.extId || stop.id, name: stop.name };
      })
      .filter(Boolean);
    return NextResponse.json(stops);
  } catch {
    return NextResponse.json([]);
  }
}

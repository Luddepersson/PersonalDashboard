import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

// ResRobot v2.1 — works for ALL of Sweden (not just Stockholm)
// Docs: https://www.trafiklab.se/api/trafiklab-apis/resrobot-v21/

const RESROBOT_KEY = "837e1118-861d-49a2-a17b-56709aa8ad9a";

export async function GET(req: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  if (!from || !to) return NextResponse.json({ error: "from and to required" }, { status: 400 });

  try {
    // Step 1: Look up stop IDs via ResRobot stolpletning
    const [fromRes, toRes] = await Promise.all([
      fetch(`https://api.resrobot.se/v2.1/location.name?input=${encodeURIComponent(from)}&format=json&accessId=${RESROBOT_KEY}&maxNo=1`),
      fetch(`https://api.resrobot.se/v2.1/location.name?input=${encodeURIComponent(to)}&format=json&accessId=${RESROBOT_KEY}&maxNo=1`),
    ]);

    if (!fromRes.ok || !toRes.ok) {
      return NextResponse.json({ error: "ResRobot platsuppslag misslyckades" }, { status: 502 });
    }

    const fromData = await fromRes.json();
    const toData = await toRes.json();

    const fromStop = fromData?.stopLocationOrCoordLocation?.[0]?.StopLocation;
    const toStop = toData?.stopLocationOrCoordLocation?.[0]?.StopLocation;

    if (!fromStop || !toStop) {
      return NextResponse.json({ error: "Kunde inte hitta hållplatsen. Prova ett annat namn." }, { status: 404 });
    }

    const fromId = fromStop.extId || fromStop.id;
    const toId = toStop.extId || toStop.id;
    const fromName = fromStop.name;
    const toName = toStop.name;

    // Step 2: Search trips
    const tripRes = await fetch(
      `https://api.resrobot.se/v2.1/trip?originId=${fromId}&destId=${toId}&format=json&accessId=${RESROBOT_KEY}&numF=5`
    );

    if (!tripRes.ok) {
      return NextResponse.json({ error: "ResRobot reseplanerare misslyckades" }, { status: 502 });
    }

    const tripData = await tripRes.json();
    const rawTrips = tripData?.Trip || [];

    const parsed = rawTrips.slice(0, 5).map((trip: Record<string, unknown>) => {
      const legList = trip.LegList as Record<string, unknown>;
      const legs = legList?.Leg;
      const legArr: Record<string, unknown>[] = Array.isArray(legs) ? legs : legs ? [legs as Record<string, unknown>] : [];

      const parsedLegs = legArr.map((leg) => {
        const origin = leg.Origin as Record<string, string>;
        const dest = leg.Destination as Record<string, string>;
        const product = leg.Product as Record<string, string> | undefined;
        const legType = leg.type as string || "";

        let type = "bus";
        const catCode = product?.catCode || "";
        const catOutL = (product?.catOutL || "").toLowerCase();
        const name = (leg.name as string || "").toLowerCase();

        if (legType === "WALK" || legType === "TRSF") {
          type = "walk";
        } else if (catOutL.includes("metro") || catOutL.includes("tunnelbana") || catCode === "1") {
          type = "metro";
        } else if (catOutL.includes("pendel") || catOutL.includes("tåg") || catOutL.includes("train") || catOutL.includes("snabbtåg") || catOutL.includes("regional") || ["2", "3", "4"].includes(catCode)) {
          type = "train";
        } else if (catOutL.includes("spår") || catOutL.includes("tram") || catCode === "9") {
          type = "tram";
        } else if (catOutL.includes("buss") || catOutL.includes("bus") || ["5", "6", "7"].includes(catCode)) {
          type = "bus";
        }

        const lineName = type === "walk"
          ? (legType === "TRSF" ? "Byte" : "Gå")
          : (product?.line ? `${product.line}` : (leg.name as string) || "");

        return {
          type,
          line: lineName,
          from: origin?.name || "",
          to: dest?.name || "",
          departure: (origin?.time || "").slice(0, 5),
          arrival: (dest?.time || "").slice(0, 5),
        };
      });

      const firstLeg = legArr[0];
      const lastLeg = legArr[legArr.length - 1];
      const depTime = ((firstLeg?.Origin as Record<string, string>)?.time || "").slice(0, 5);
      const arrTime = ((lastLeg?.Destination as Record<string, string>)?.time || "").slice(0, 5);

      let duration = "";
      if (depTime && arrTime) {
        const [dh, dm] = depTime.split(":").map(Number);
        const [ah, am] = arrTime.split(":").map(Number);
        let mins = (ah * 60 + am) - (dh * 60 + dm);
        if (mins < 0) mins += 1440;
        duration = `${mins} min`;
      }

      return {
        origin: fromName,
        destination: toName,
        departureTime: depTime,
        arrivalTime: arrTime,
        duration,
        legs: parsedLegs,
      };
    });

    return NextResponse.json({ trips: parsed, fromName, toName });
  } catch (e) {
    return NextResponse.json({ error: "Nätverksfel vid sökning" }, { status: 500 });
  }
}

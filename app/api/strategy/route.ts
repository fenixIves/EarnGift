import { NextRequest, NextResponse } from "next/server";
import { discoverStrategy, type DurationOption } from "@/lib/earn";

export async function GET(request: NextRequest) {
  const durationValue = request.nextUrl.searchParams.get("duration");
  const duration = Number(durationValue) as DurationOption;

  if (![30, 90, 180].includes(duration)) {
    return NextResponse.json({ error: "Invalid duration." }, { status: 400 });
  }

  const strategy = await discoverStrategy(duration);
  return NextResponse.json(strategy);
}

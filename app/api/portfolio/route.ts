import { NextRequest, NextResponse } from "next/server";
import { loadPortfolioPositions } from "@/lib/earn";

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "Missing address." }, { status: 400 });
  }

  const positions = await loadPortfolioPositions(address);
  return NextResponse.json({ positions });
}

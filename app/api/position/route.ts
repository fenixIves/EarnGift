import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const amount = Number(request.nextUrl.searchParams.get("amount") ?? "0");
  const apy = Number(request.nextUrl.searchParams.get("apy") ?? "0");
  const depositedAt = Number(request.nextUrl.searchParams.get("depositedAt") ?? Date.now());

  const secondsElapsed = Math.max(1, Math.floor((Date.now() - depositedAt) / 1000));
  const yearlyYield = amount * (apy / 100);
  const perSecond = yearlyYield / (365 * 24 * 60 * 60);
  const earned = Number((perSecond * secondsElapsed).toFixed(6));

  return NextResponse.json({
    earned,
    yearlyYield: Number(yearlyYield.toFixed(2)),
    updatedAt: Date.now()
  });
}

import { NextRequest, NextResponse } from "next/server";

const QUOTE_API_BASE = "https://li.quest/v1/quote";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    fromChain: number;
    toChain: number;
    fromToken: string;
    toToken: string;
    fromAmount: string;
    fromAddress: string;
    toAddress: string;
  };

  const params = new URLSearchParams({
    fromChain: String(body.fromChain),
    toChain: String(body.toChain),
    fromToken: body.fromToken,
    toToken: body.toToken,
    fromAmount: body.fromAmount,
    fromAddress: body.fromAddress,
    toAddress: body.toAddress,
    integrator: "warm-yield"
  });

  const response = await fetch(`${QUOTE_API_BASE}?${params.toString()}`, {
    headers: {
      accept: "application/json",
      ...(process.env.LIFI_API_KEY ? { "x-lifi-api-key": process.env.LIFI_API_KEY } : {})
    },
    cache: "no-store"
  });

  const payload = await response.json();

  if (!response.ok) {
    return NextResponse.json(payload, { status: response.status });
  }

  return NextResponse.json(payload);
}

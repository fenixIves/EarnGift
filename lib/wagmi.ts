"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "viem";
import { supportedChains } from "@/lib/chains";

export const walletConfig = getDefaultConfig({
  appName: "Warm Yield",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo",
  chains: supportedChains,
  transports: {
    1: http(process.env.NEXT_PUBLIC_ETHEREUM_RPC || "https://cloudflare-eth.com"),
    8453: http(process.env.NEXT_PUBLIC_BASE_RPC || "https://mainnet.base.org"),
    42161: http(process.env.NEXT_PUBLIC_ARBITRUM_RPC || "https://arb1.arbitrum.io/rpc"),
  },
  ssr: true,
});

"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { supportedChains } from "@/lib/chains";

export const walletConfig = getDefaultConfig({
  appName: "Warm Yield",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo",
  chains: supportedChains,
  ssr: true
});

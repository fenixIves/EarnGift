import type { Metadata } from "next";
import "./globals.css";
import { ProvidersGate } from "./providers-gate";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Warm Yield",
  description: "A human-first LiFi Earn demo for the DeFi UX Challenge."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={cn("font-sans", geist.variable)}>
      <body>
        <ProvidersGate>{children}</ProvidersGate>
      </body>
    </html>
  );
}

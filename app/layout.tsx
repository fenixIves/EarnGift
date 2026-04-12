import type { Metadata } from "next";
import "./globals.css";
import { ProvidersGate } from "./providers-gate";

export const metadata: Metadata = {
  title: "Earn Gift",
  description: "A human-first LiFi Earn demo for the DeFi UX Challenge."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <ProvidersGate>{children}</ProvidersGate>
      </body>
    </html>
  );
}

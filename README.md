# Earn Gift

Deposit stablecoins on Base in a calm, one-screen flow that feels like a savings form, not a protocol dashboard.

## Background / Pain Points

- DeFi deposit flows are noisy, multi-step, and intimidating for non-native users.
- Users struggle to choose a vault, understand risk, and verify that funds are working.
- Cross-chain choices add friction and increase the chance of failed tests.

## Core Features (Focus)

- Base-first vault discovery with LI.FI Earn, reducing failed deposits from wrong-chain picks.
- Real Composer quote → approval → deposit execution, with on-chain tx hashes and scan links.
- Portfolio verification via LI.FI Earn positions and a live “earnings tick” after deposit.
- Simplified “deposit slip” UI: duration → strategy → amount → execute → verify.

## Quick Start

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Tech Stack

- Next.js (App Router)
- React + TypeScript
- Tailwind CSS
- wagmi + RainbowKit
- viem
- LI.FI Earn + Composer APIs

## Highlights / Innovation

- Base-prioritized strategy selection to minimize wrong-chain failures during demos.
- Plain-language UX: translates protocol actions into “approve” and “deposit” steps.
- Verification built in: scan links and portfolio API check on the success screen.

## Team

- Product, design, and engineering team focused on DeFi onboarding UX.

## Future Plans

- Smarter approvals (batch or allowance presets) to reduce repeated gas.
- Risk notes per vault and clearer safety cues for first-time users.
- More chains once the Base-first experience is proven.

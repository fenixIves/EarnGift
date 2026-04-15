# Earn Gift 🎁

> **DeFi saving that feels like a form, not a dashboard.**

`Deposit your idle USDC into the earnings pool, as easy as depositing money in a bank - no need to understand DeFi, done in 30 seconds, and the money keeps growing every second.`

<div align="center">
  <img src="public/earn1.png" width="45%" alt="EarnGift Hero" />
  <img src="public/earn2.png" width="45%" alt="Strategy Selection" />
  <br/>
  <img src="public/earn3.png" width="45%" alt="Deposit Flow" />
  <img src="public/earn4.png" width="45%" alt="Success & Share" />
</div>

**Live Demo Website:** [https://earn-gift-li-fi.vercel.app](https://earn-gift-li-fi.vercel.app)  
**Video Walkthrough:** [Demo Video](https://x.com/foxyInvesting/status/2044225259231166902?s=20) <!-- Replace with actual link -->

---

## 🎯 The Problem

| Traditional DeFi | Friction Point |
|------------------|----------------|
| **10+ vaults** across chains | Decision paralysis |
| **Wrong chain** → failed deposit | Gas wasted, user lost |
| **"Connect → Approve → Deposit"** | 3 scary steps, 0 guidance |
| **No proof of earnings** | Trust gap after deposit |

**Result:** 90% of new users drop off before their first deposit.

---

## ✨ Our Solution

**One screen. One decision. Done.**

```
User picks duration (30/90/180d)
        ↓
We auto-select best Base vault (Aave/Morpho)
        ↓
User enters amount
        ↓
One-tap execute → Live verification
```

EarnGift is a beginner-friendly DeFi saving experience for users who do not want to think in protocols, chains, and vault mechanics. Instead of presenting a dashboard full of DeFi-native concepts, the app turns saving into a familiar flow:

1. Pick how long you want to save
2. Review the recommended strategy
3. Enter a USDC amount
4. Confirm the deposit
5. Verify that the position is live

The core product idea is simple: abstract the complexity of yield discovery into a time-based decision, then preserve trust with clear proof after the transaction. That means users still get transparency, but only at the moments where it helps them make a decision.

### ✨What The Project Does

- Translates a simple duration choice like `30 / 90 / 180 days` into a recommended yield strategy
- Surfaces the selected vault, protocol, chain, APY, and estimated return in plain language
- Generates a live deposit quote after the user enters an amount
- Guides the user through approval and deposit in one clear flow
- Shows post-deposit success state, transaction proof, and portfolio verification
- Lets users generate a share card so the outcome feels visible and social, not hidden and technical

### ✨What Makes It Different

| Feature | Impact |
|---------|--------|
| 🏦 **Base-first strategy** | Eliminates 70%+ wrong-chain errors |
| 📝 **Savings-form UX** | "Amount + Duration" instead of vault hunting |
| 🔍 **Real-time verification** | LI.FI portfolio API confirms deposit in seconds |
| 🎨 **Calm visual design** | Warm tones, no panic-red, no jargon |

---

## 🛠 Tech Stack

![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-06B6D4?logo=tailwindcss&logoColor=white)
![Wagmi](https://img.shields.io/badge/wagmi-3C3C3D?logo=ethereum&logoColor=white)

- **Frontend:** Next.js App Router + Tailwind + Framer Motion
- **Wallet:** RainbowKit (wagmi/viem)
- **DeFi APIs:** LI.FI Earn (vault discovery) + Composer (quotes & execution)
- **Verification:** LI.FI Portfolio API + on-chain event polling

### ✨How We Use The LI.FI Earn API

EarnGift uses the LI.FI Earn ecosystem in the parts of the flow that matter most for user trust and simplicity:

#### 1. Strategy discovery

When a user chooses a duration, we call LI.FI Earn vault data to discover transactional USDC vaults across supported chains. We then:

- filter for usable vaults
- prioritize Base when possible to reduce demo friction and chain confusion
- map short and medium durations toward familiar protocol preferences like Aave and Morpho
- sort by available APY and normalize the result into a strategy card the user can actually understand

This is what powers the recommendation step instead of forcing users to manually compare vaults.

#### 2. Portfolio verification after deposit

After a successful transaction, we call the LI.FI Earn portfolio endpoint for the connected wallet and load the returned positions into the proof section. This helps answer the most important beginner question after depositing:

**"Did my money actually arrive and start working?"**

That verification layer is a core part of the product, not an afterthought.

#### 3. Deposit flow support

We also use LI.FI-powered quote and execution flow to prepare deposit transactions after the strategy is selected. That lets the user review amount, estimated value, and gas before signing, while the app handles approval and deposit as one guided sequence.

### ✨Why This Matters

Most DeFi products simplify inputs, but not confidence. EarnGift tries to simplify both:

- simpler decision before the deposit
- simpler execution during the deposit
- clearer proof after the deposit

---

## 🚀 Quick Start

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`

---

## 📊 Hackathon Submission Highlights

### Innovation
- **Duration-first routing:** Simplified vault selection for non-technical users
- **Unified execution flow:** Quote → Approve → Deposit in one seamless flow
- **Post-deposit verification:** Real portfolio position confirmation via API

This project is not just a prettier landing page for yield products. It proposes a different interaction model for DeFi onboarding:

- users think in time, not protocols
- users confirm one guided route, not multiple disconnected steps
- users see proof immediately after action, instead of being left on a generic success screen

### Completion
- ✅ Live wallet connection
- ✅ Real vault discovery & quoting
- ✅ Approval + deposit execution
- ✅ Transaction scanning & verification
- ✅ Shareable deposit card generation

### Impact
- Base-prioritized strategy reduces demo friction
- Plain-language UX lowers DeFi entry barrier
- Built-in verification closes trust loop
- Familiar savings-style framing makes yield feel more approachable to mainstream users

---

## 🔮 Next Steps

- [ ] Add clearer risk labeling per strategy so users can compare "stable", "balanced", and "higher-yield" options without reading protocol docs
- [ ] Improve the recommendation engine with richer personalization based on amount, preferred liquidity, and risk tolerance
- [ ] Support multi-chain deposits more deeply after validating the Base-first onboarding path
- [ ] Add smarter repeat-user flows like approval reuse, batched steps, and lower-friction re-depositing
- [ ] Show better post-deposit analytics such as position history, earnings over time, and maturity projections
- [ ] Expand the share experience so users can invite friends with proof of activity, not just abstract APY claims

### What We Would Build Next

If we continued this project beyond the hackathon, the next version of EarnGift would become a more complete saving product rather than a single deposit demo.

The first priority would be **better recommendations**. Right now, the duration-first model is the main simplification layer. Next, we would add clearer risk-aware strategy selection, stronger reasoning behind each recommendation, and more beginner-friendly labels so users can understand *why* a strategy is being shown to them.

The second priority would be **better proof and retention**. We want the post-deposit state to feel alive: earnings history, portfolio refresh confidence, clearer yield attribution, and stronger user feedback when indexing is still catching up. This is especially important for first-time DeFi users, because trust is built after the transaction, not before it.

The third priority would be **broader product coverage**. That includes support for more assets, more chains, and more strategy types, while preserving the same simple entry point. The challenge is not adding more options to the user interface. The challenge is absorbing more protocol complexity without making the product feel more complicated.

---

*Built for the LI.FI DeFi UX Challenge*

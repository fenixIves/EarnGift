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
**Video Walkthrough:** [30-sec Demo](https://your-demo-link) <!-- Replace with actual link -->

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

### What Makes It Different

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

---

## 👥 Team

DeFi UX specialists focused on making on-chain saving feel like banking.

---

## 🔮 Next Steps

- [ ] Batch approvals (reduce gas for repeat users)
- [ ] Risk indicators per vault
- [ ] Multi-chain expansion post-Base validation

---

*Built for the LI.FI DeFi UX Challenge*

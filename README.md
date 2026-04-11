# Warm Yield

A hackathon-ready `Next.js + Tailwind` demo for the LiFi `DeFi UX Challenge`.

## What is included

- A warm retro-futurist landing page and core single-page experience
- 5-step product flow based on the hackathon prompt
- Real LI.FI Earn vault discovery through `/api/strategy`
- RainbowKit wallet connection
- Real Composer quote generation through `/api/quote`
- Approval + deposit execution path with tx hash and scan links
- Portfolio verification through `/api/portfolio`
- Earnings polling through `/api/position`
- Share-card generation with `html2canvas`

## Flow

1. User chooses `30 / 90 / 180` days.
2. The app calls LI.FI Earn vault discovery and applies the simplified routing logic:
   - `30 days -> protocol=aave`
   - `90 days -> protocol=morpho`
   - `180 days -> all supported protocols, top APY`
3. User connects wallet and enters amount.
4. The app requests a real Composer quote.
5. The app can submit approval and deposit transactions, then show scan links and portfolio verification.

## Local development

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Notes

- For WalletConnect-based wallets, replace `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` with your own project id.
- Portfolio verification can also be checked manually:

```bash
curl -X GET 'https://earn.li.fi/v1/earn/portfolio/0xYOUR_WALLET_ADDRESS/positions'
```

# WillFolks

**Put your money where your goals are.** WillFolks is a dApp for people who want to stick to their goals.
You create a goal (wake up early, limit app usage, arrive somewhere on time, finish a chore) and lock a
stake in USDC. Meet the goal and the money is yours to withdraw at any time. Miss it and the stake stays
locked for a set period as a penalty. It is never kept: once the lock ends, it comes back.

Monad Hackathon (Metropolis) · track **Consumer Products & Payments**. Everything runs on **Monad testnet**;
no real money is involved.

| | |
| --- | --- |
| Website | https://willfolks.bamp.lat |
| Live product (how to try it) | https://willfolks.bamp.lat/live |
| Android app (1.1.0) | [Releases](https://github.com/SaulChoque/WillFolks-monorepo/releases/latest) |
| API | https://api.willfolks.bamp.lat/health |
| Technical demo · Pitch · Promo | [/demo](https://willfolks.bamp.lat/demo) · [/pitch](https://willfolks.bamp.lat/pitch) · [/promo](https://willfolks.bamp.lat/promo) |
| Go-to-market | https://willfolks.bamp.lat/gtm |
| X | https://x.com/WillFolksApp |

## Try it

1. Install the Android app from the [releases](https://github.com/SaulChoque/WillFolks-monorepo/releases/latest)
   and sign in with any email (development login).
2. Open **Wallet** and tap **Get test balance**: you get 3 test USDC plus gas.
3. Create an **Alarm** goal with a 1 USDC stake and tap **Stake it**. The goal shows the stake in play with a
   link to the transaction.
4. Demo goals last about 5 minutes; when they end the stake returns and the Wallet history shows the
   transaction.
5. Any other goal type works too, but some take longer to resolve.
6. Wallet → **Buy USDC with QR**: pick an amount, the app quotes it at 11.89 Bs per dollar and shows the Bolivian
   bank QR (QR Simple) that TilcAI issues, redrawn in the app's style. Once the bank reports it paid, the USDC
   arrives in your wallet on Monad.

## Repository layout

Each folder was its own repository; their full histories were merged here, so `git log -- <folder>`
shows every original commit.

| Folder | What it is | Stack |
| --- | --- | --- |
| [`willfolks-expo-app`](willfolks-expo-app) | Android app: goals, wallet, alarms, app usage, location, camera, widget | Expo / React Native, Kotlin native module |
| [`willfolks-BE`](willfolks-BE) | API: verifies receipts, signs and sends verdicts, reclaims stakes; TilcAI vault, relayer and x402 judge | NestJS, PostgreSQL, viem, deployed on Vercel |
| [`willfolks-smartcontracts`](willfolks-smartcontracts) | `WillFolksEscrow`: stake locked by the user's wallet, EIP-712 verdict from an authorised attestor, failure lock, `reclaim` if nobody resolves | Solidity, Foundry, OpenZeppelin |
| [`willfolks-database`](willfolks-database) | Schema, views, seed data and docs | PostgreSQL |
| [`willfolks-landing`](willfolks-landing) | Website, in English and Spanish | Next.js, anime.js, three.js |

## On-chain

| | |
| --- | --- |
| Network | Monad testnet · chain id 10143 |
| `WillFolksEscrow` | [`0x3422820Ef9FBC8e0206E4CBcB6369dBd14BE18c4`](https://testnet.monadscan.com/address/0x3422820Ef9FBC8e0206E4CBcB6369dBd14BE18c4) |
| USDC (test) | [`0x534b2f3A21130d7a60830c2Df862319e593943A3`](https://testnet.monadscan.com/address/0x534b2f3A21130d7a60830c2Df862319e593943A3) |

## Run it locally

```bash
git clone --recurse-submodules https://github.com/SaulChoque/WillFolks-monorepo.git
cd WillFolks-monorepo

(cd willfolks-database && docker compose up -d --wait)
(cd willfolks-BE && cp .env.example .env && npm ci && npm run build && node dist/main.js)
(cd willfolks-expo-app && npm ci && npx expo start)
(cd willfolks-smartcontracts && forge test)
(cd willfolks-landing && pnpm install && pnpm dev)
```

Each folder's README covers its variables, tests and caveats.

## Said plainly

- The contract is unaudited, testnet only, and capped at 10 USDC per goal.
- One attestor (the backend) signs verdicts today; a quorum of verifiers is a later phase.
- Alarm and app-usage results are reported by the phone and trusted by the server.
- The AI judge is a stub that approves any photo; the friend judge is real.
- Buying USDC with a bank QR runs against TilcAI's QR Simple service on testnet; bank withdrawals do not exist yet,
  and sign-in is a development login.

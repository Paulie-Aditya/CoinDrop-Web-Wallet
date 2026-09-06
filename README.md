# CoinDrop Wallet (web)

The web companion for the [CoinDrop](https://coindrop.cc) tipping bot. A logged-in
user sees the coins they hold and every tip, drop, deposit and withdrawal that's
moved through their account. **View-only for now** — sending to other usernames
comes later.

Stack: React 19 + Vite + TypeScript, React Router, TanStack Query, axios. No UI
framework — the components and design tokens are local (`src/index.css`).

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
```

`npm run dev` starts in **mock mode** (`VITE_USE_MOCK="true"` in `.env`): fake data,
a fake Discord login, no backend needed. Click "Continue with Discord" and you're in.

To run against a real backend, set in `.env`:

```
VITE_API_URL="https://your-backend"
VITE_USE_MOCK="false"
```

Other scripts: `npm run build`, `npm run lint`, `npm run preview`.

## How auth works

Cookie session — the frontend never touches a token.

1. `startLogin("discord")` does a full-page redirect to
   `${VITE_API_URL}/auth/discord?redirect=<origin>/auth/callback`.
2. The backend runs the Discord OAuth dance, sets an **httpOnly session cookie**,
   and redirects the browser to `/auth/callback` on this app.
3. `/auth/callback` re-checks the session and routes to `/wallet`.
4. Every request goes out with `withCredentials: true`. A `401` from `/auth/me`
   means "not logged in" and bounces to `/login`.

Telegram and Google buttons are in the UI but disabled (`AUTH_PROVIDERS` in
`src/api/auth.ts`) until their backend routes exist.

## Backend API contract

The frontend expects these endpoints under `VITE_API_URL`. The mock layer in
`src/api/mock/` implements the same shapes — keep them in sync.

Ledger amounts are `DECIMAL(65,0)` **smallest-unit integers** (wei, sats, …),
always sent as **strings**. The frontend formats them with `decimals`.

### `GET /auth/me`
`200` → `{ "user": { "id": string, "username": string, "avatarUrl": string | null, "platform": "discord" } }`
`401` if there's no valid session.

### `POST /auth/logout`
Clears the session cookie. `200`/`204`.

### `GET /auth/discord`
Starts OAuth. Honors a `?redirect=` back to this app; ends by redirecting to
`/auth/callback` (append `?error=...` if the user bailed).

### `GET /wallet/balances`
```jsonc
{
  "totalUsd": "8161.60",          // sum of usdValue, decimal string
  "balances": [
    {
      "currencyId": 1,
      "symbol": "BTC",
      "name": "Bitcoin",
      "decimals": 8,
      "amount": "4120000",         // smallest-unit integer string
      "usdValue": "2636.80"        // or null when the coin has no price
    }
  ]
}
```
Zero balances can be included or omitted — the UI hides them either way.

### `GET /wallet/transactions`
Query params (all optional): `direction` = `received` | `sent`, `currency` = symbol,
`cursor` = opaque string from a previous response, `limit`.

```jsonc
{
  "transactions": [
    {
      "id": "tx_2f1a",
      "direction": "in",           // "in" | "out"
      "kind": "tip",               // tip | airdrop | raffle | quickdrop | slowdrop
                                   //  | mathtip | triviadrop | swap | deposit | withdrawal
      "counterparty": "quill",     // other party's username, or null
      "symbol": "USDC",
      "decimals": 6,
      "amount": "25000000",
      "usdValue": "25.00",         // or null
      "timestamp": "2026-09-06T12:00:00.000Z"
    }
  ],
  "nextCursor": "8"                // null when there are no more pages
}
```

## Layout

```
src/
  api/            axios instance, endpoint fns, types, and the mock backend
  app/            router + auth gate
  components/     Button, CoinLoader, CoinChip, PageShell, …
  features/
    auth/         useSession, useLogout
    wallet/       useBalances, useTransactions, BalancesCard, ActivityCard
  lib/            formatUnits / formatUsd / relativeTime, query client
  pages/          Landing, Login, AuthCallback, Wallet, NotFound
```

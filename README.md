# CoinDrop Wallet (web)

The web companion for the [CoinDrop](https://coindrop.cc) tipping bot. A logged-in
user sees the coins they hold, every tip and drop that's moved through their
account, and can deposit or withdraw directly. **Sending to other usernames
comes later** — everything else is live.

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

`vite build` loads `.env.production`, which forces `VITE_USE_MOCK=false` — the mock
layer can't ship. Set `VITE_API_URL` in the host's build environment.

## Deployment

**`wallet.coindrop.cc`** on Vercel + a **Flask** backend on `backend.coindrop.cc`.
Full runbook, cookie/CORS config, and a Flask route skeleton are in
[`deploy/DEPLOY.md`](deploy/DEPLOY.md).

- Vercel builds this repo; `vercel.json` handles the SPA fallback. Set
  `VITE_API_URL=https://backend.coindrop.cc` as a Vercel env var.
- Both hosts are under `coindrop.cc`, so the session cookie is same-site
  (`Domain=.coindrop.cc; SameSite=Lax; Secure; HttpOnly`) — Flask just needs
  `flask-cors` with `supports_credentials=True` and the exact frontend origin.
- Flask reads CoinDrop's MySQL and resolves the Discord id with the bot's
  `core_ops.resolve_or_create_user` / `resolve_canonical_id`.

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
always sent as **strings** — including every amount in the withdraw endpoints
below (`amount`, `sendAmount`, `platformFee`, `gasFee`). The frontend converts
with `decimals` (`parseUnits` going out, `formatUnits` coming back); never send
or expect a human-decimal string like `"0.5"`.

Errors are `{ "detail": "message" }` with an appropriate status code — the
frontend reads `detail`, not `message`.

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

`cursor` is opaque to the frontend — a stringified `offset` is fine.
`kind` may be more than the `transactions` table records; unknown values render as
a plain "Received"/"Sent". `counterparty` is the other user's `username` (resolve
`from_user`/`to_user` against `users`), or `null` for bot/system drop payouts.
Deposits and withdrawals live in `platform_fees` / `withdrawal_queue`, not
`transactions` — fold them in with a `UNION` when you want them in the feed.

### `GET /wallet/deposit/<symbol>`
Generates a wallet on first request, returns the same one after. `404` (with a
`detail`) for an unsupported symbol.

```jsonc
{
  "symbol": "BC3",
  "chainName": "BitcoinIII",
  "address": "1MdFA8pWRV3DqE6yNaAo7LNyrrrXsUbc5K",
  "memo": null,              // set for shared-hot-wallet coins (WAX, XRP, XLM, …)
  "destinationTag": null     // XRP-style numeric tag; mutually exclusive with memo
}
```
When `memo`/`destinationTag` is set, the frontend shows it as a hard requirement
right under the address — don't omit it for coins that need it.

### `POST /wallet/withdraw/estimate`
Body: `{ "symbol": "BC3", "toAddress": "...", "amount": "500000000", "memo": null }`
— **`amount` is a smallest-unit integer string**, same as everywhere else (5 BC3
at 8 decimals is `"500000000"`, not `"5"`). No side effects.

```jsonc
{
  "token": "<opaque, single-use>",
  "currency": "BC3",
  "toAddress": "...",
  "memo": null,
  "amount": "500000000",
  "sendAmount": "497490000",
  "platformFee": "2500000",
  "gasFee": "10000",
  "amountUsd": "185.20",       // decimal string; null (not "0") if uncached
  "sendAmountUsd": "184.28",
  "platformFeeUsd": "0.93",
  "gasFeeUsd": "0.004",
  "expiresInSeconds": 30
}
```
The four `*Usd` fields are priced off one snapshot so they stay consistent with
each other (and roughly with `/wallet/balances`, modulo price-cache staleness).
`400` for a bad amount (non-positive, exceeds balance, or too small to clear
fees) — `detail` carries the reason and the frontend surfaces it verbatim.

### `POST /wallet/withdraw/confirm`
Body: `{ "token": "..." }` → `{ "status": "queued" }`. Deducts the balance and
hands off to the withdrawal worker — irreversible. `400` if the token is
unknown, already used, or its 30-second window has passed.

## Layout

```
src/
  api/            axios instance, endpoint fns, types, and the mock backend
                  (mock covers auth + balances/transactions only — deposit and
                  withdraw always hit the real backend)
  app/            router + auth gate
  components/     Button, CoinLoader, CoinChip, CopyButton, PageShell, …
  features/
    auth/         useSession, useLogout
    wallet/       useBalances, useTransactions, useDeposit, useWithdraw,
                  BalancesCard, ActivityCard
  lib/            formatUnits/parseUnits, formatUsd, relativeTime, query client
  pages/          Landing, Login, AuthCallback, Wallet, Deposit, Withdraw, NotFound
```

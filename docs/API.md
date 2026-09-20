# Backend API reference

The full contract this frontend expects from the backend at `VITE_API_URL`. The
mock layer in `src/api/mock/` implements the same shapes for auth and
balances/transactions — keep the two in sync.

## Conventions

- **Amounts are smallest-unit integers, always as strings** (`DECIMAL(65,0)` —
  wei, sats, …), including every amount in the withdraw endpoints (`amount`,
  `sendAmount`, `platformFee`, `gasFee`). The frontend converts with a
  currency's `decimals` (`parseUnits` going out, `formatUnits` coming back) —
  never send or expect a human-decimal string like `"0.5"`.
- **USD values are decimal strings, or `null`** (never `"0"`) when a coin has
  no cached price.
- **Errors are `{ "detail": "message" }`** with an appropriate status code —
  the frontend reads `detail`, not `message`.

## `GET /auth/me`

`200` → `{ "user": { "id": string, "username": string, "avatarUrl": string | null, "platform": "discord" } }`
`401` if there's no valid session.

## `POST /auth/logout`

Clears the session cookie. `200`/`204`.

## `GET /auth/discord`

Starts OAuth. Honors a `?redirect=` back to this app; ends by redirecting to
`/auth/callback` (append `?error=...` if the user bailed).

## `GET /wallet/balances`

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

## `GET /wallet/transactions`

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

## `GET /wallet/deposit/<symbol>`

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

## `POST /wallet/withdraw/estimate`

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

## `POST /wallet/withdraw/confirm`

Body: `{ "token": "..." }` → `{ "status": "queued" }`. Deducts the balance and
hands off to the withdrawal worker — irreversible. `400` if the token is
unknown, already used, or its 30-second window has passed.

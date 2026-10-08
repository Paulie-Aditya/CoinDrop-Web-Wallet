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

```jsonc
{
  "user": {
    "id": "464445762986704918",
    "username": "paulieadi",
    "handle": null,            // some platforms show a discriminator alongside the username
    "avatarUrl": "https://cdn.discordapp.com/avatars/.../....png",
    "platform": "discord",
    "publicId": 5              // the numeric CoinDrop ID other users send to — see /wallet/send/estimate
  }
}
```

`401` if there's no valid session. `publicId` and `handle` confirmed live 2026-10-05 —
not something the frontend surfaced before the Send feature needed it.

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
  "decimals": 8,
  "chainName": null,           // e.g. "Solana"; null if unknown
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

For `chainName: "Solana"` (SOL itself or any SPL token), `gasFee` jumps from
the usual ~$0.002 tx fee to ~$0.40 the first time a destination address
receives that token, since it has no on-chain token account yet. `gasFee`'s
raw integer is always in `currency`'s own smallest unit, never lamports, so
compare `gasFeeUsd` (not `gasFee`) if you need to detect this case generically
across coins.

## `POST /wallet/withdraw/confirm`

Body: `{ "token": "..." }` → `{ "id": "112", "status": "queued" }`. Deducts the
balance and hands off to the withdrawal worker — irreversible. `400` if the
token is unknown, already used, or its 30-second window has passed. `id` is
the `withdrawal_queue` row — poll it with the endpoint below.

## `GET /wallet/withdraw/<id>`

Live status for a withdrawal this session created. Scoped to the caller's own
rows — a different user's id (or someone else's entirely) returns a plain
`404`, not `403`, so it can't be used to enumerate other people's withdrawals.
The frontend polls this every 4s until `status` reaches `done` or `failed`.

```jsonc
{
  "id": "112",
  "status": "done",             // queued | processing | done | failed
  "currency": "LTC",
  "decimals": 8,
  "toAddress": "...",
  "memo": null,
  "amount": "150000000",
  "sendAmount": "148500000",
  "platformFee": "750000",
  "gasFee": "750000",
  "amountUsd": "12.30",
  "sendAmountUsd": "12.18",
  "platformFeeUsd": "0.06",
  "gasFeeUsd": "0.06",
  "txHash": "3b1e...",          // null until status is "done"
  "explorerUrl": "https://..."  // null until status is "done"
}
```

`explorerUrl` is built from the chain's own `explorer_url` — the same link the
bot's own success DM uses. **A `"failed"` status is not auto-refunded** — that
matches the bot's existing behavior (this endpoint only surfaces it, doesn't
change it); the frontend tells the user to contact support with the id rather
than implying the balance will come back on its own.

## `POST /wallet/send/estimate`

CoinDrop-to-CoinDrop transfer, resolved by recipient **publicId**, not
username — there's no lookup-by-username endpoint, so the frontend asks for a
numeric CoinDrop ID directly (see `GET /auth/me` for where a user finds their
own). No side effects, safe to retry.

Body: `{ "toPublicId": 5, "symbol": "SOL", "amount": "1000000" }` — `amount` is
a smallest-unit integer string, same convention as everywhere else.

```jsonc
{
  "token": "<signed, single-use, expires in expiresInSeconds>",
  "toPublicId": "5",
  "toUsername": "paulieadi",
  "toHandle": null,
  "symbol": "SOL",
  "decimals": 9,
  "amount": "1000000",
  "usdValue": "0.12",          // null if uncached
  "expiresInSeconds": 30
}
```

Unlike withdraw, there's no fee breakdown — an internal transfer, no network
or platform fee. `toUsername`/`toHandle` are shown prominently before confirm
— the only fat-finger check against a mistyped publicId. Error cases:
`400 {"detail": "You can't send to yourself."}`,
`404 {"detail": "Recipient not found."}`,
`400 {"detail": "Insufficient balance."}`.

## `POST /wallet/send/confirm`

Body: `{ "token": "..." }` → `{ "status": "sent" }`. Deducts the sender's
balance and credits the recipient's — irreversible, and synchronous (no
`withdrawal_queue`-style async status to poll; `"sent"` means it already
happened). `409 {"detail": "This confirmation has expired. Estimate again."}`
if the 30-second window has passed.

## `GET /wallet/notifications`

Session-authenticated, deposit notifications only for now (the bot's own
Discord/Telegram DMs are unaffected — this is a third channel, not a
replacement). Same cursor-pagination convention as `/wallet/transactions`.

Query params (all optional): `unseenOnly=1` (only unread — the cheap way to
poll just the badge count), `cursor` = opaque string from a previous
response, `limit` (default 25, capped 100).

```jsonc
{
  "notifications": [
    {
      "id": 1,                      // number, not a string
      "kind": "deposit",
      "symbol": "SOL",
      "amount": "5000000",          // smallest-unit integer string
      "usdValue": "0.55",           // null if uncached
      "txHash": "abc123...",        // null for coins with no sweep tx (WAX/XRP)
      "chainName": "Solana",        // can be null
      "seen": false,
      "createdAt": "2026-09-27T19:07:24Z"
    }
  ],
  "unseenCount": 1,
  "nextCursor": null
}
```

**No `decimals` field** — resolve it by cross-referencing the symbol against
`/wallet/balances`. `unseenCount` is a total regardless of pagination, so the
bell badge doesn't need to load the list — poll
`GET /wallet/notifications?unseenOnly=1&limit=1` every 15–30s for that, and
only fetch the full list when the panel actually opens.

Fed by the bot's own `monitor_ws.add_to_db`, which POSTs to `/internal/deposit`
(bot-only, its own `x-internal-secret`, separate from any other internal
secret this API uses) right after a deposit credit commits; that write
resolves the user through `resolve_canonical_id` so a deposit to a
since-merged account still lands on the right person.

## `POST /wallet/notifications/<id>/seen`

No body. Always `200 {"status": "seen"}` — safe to call on an already-seen or
invalid id, silent no-op, never errors. The frontend calls this when the user
clicks a row, not in bulk.

## `GET /wallet/deposits` *(shapes below are inferred, not yet confirmed live — prod 404s on this route as of 2026-09-28)*

Deposit history. Query params (all optional): `currency`, `cursor`, `limit`.
Reads the same `wallet_notifications` table as `/wallet/notifications`, so
each row is presumed to match that shape exactly:

```jsonc
{
  "deposits": [
    {
      "id": 1,
      "kind": "deposit",
      "symbol": "SOL",
      "amount": "5000000",       // smallest-unit integer string, no decimals field
      "usdValue": "0.55",        // or null
      "txHash": "abc123...",     // or null (WAX/XRP have no sweep tx)
      "chainName": "Solana",     // or null
      "seen": false,
      "createdAt": "2026-09-27T19:07:24Z"
    }
  ],
  "nextCursor": null
}
```

**Only has data from whenever deposit notifications started landing — there is
no historical backfill.** A user's real first deposit may not appear here even
though it's in their balance; surface this in the UI, don't let it read as a
bug.

**Needs its own `decimals` field** (here and on `/wallet/notifications`), the
same way `/wallet/withdraw/<id>` already carries one. Today the frontend
resolves it by cross-referencing `symbol` against the user's *current*
`/wallet/balances` — which breaks for any coin they've since fully withdrawn
or swapped away, since "zero balances can be included or omitted" there (see
above). That showed up as a real bug: a BNB deposit rendered as
`824599497119383 BNB` instead of `0.00082459... BNB` because BNB wasn't in the
balances snapshot to resolve against. The frontend now hides the amount
rather than show a raw, un-divided integer, but the actual fix is this field.

## `GET /wallet/withdraw` *(list — createdAt still unconfirmed, see below)*

Withdrawal history, **all** of a user's `withdrawal_queue` rows regardless of
`origin_platform` (Discord/Telegram-originated withdrawals show up here too).
Complete from day one — no backfill gap like deposits, since `withdrawal_queue`
has always stored the real `send_amount`. Query params (all optional):
`currency`, `status` (`queued`|`processing`|`done`|`failed`), `cursor`, `limit`.

Shares `_serialize_withdrawal_row` with `GET /wallet/withdraw/<id>`, so each
row matches `WithdrawStatus` (including `decimals` — confirmed live
2026-09-28: ETH returns `18`, LTC returns `8`, matching `/wallet/balances`),
plus (unconfirmed) a `createdAt` a history list would need that the
single-status lookup never mentioned:

```jsonc
{
  "withdrawals": [
    {
      "id": "112",
      "status": "done",
      "currency": "LTC",
      "decimals": 8,
      "toAddress": "...",
      "memo": null,
      "amount": "150000000",
      "sendAmount": "148500000",
      "platformFee": "750000",
      "gasFee": "750000",
      "amountUsd": "12.30",
      "sendAmountUsd": "12.18",
      "platformFeeUsd": "0.06",
      "gasFeeUsd": "0.06",
      "txHash": "3b1e...",
      "explorerUrl": "https://...",
      "createdAt": "2026-09-27T19:07:24Z"  // unconfirmed field
    }
  ],
  "nextCursor": null
}
```

If `createdAt` isn't actually present, the frontend just omits the relative
timestamp per row rather than breaking — but it's worth confirming, since a
history list with no dates at all is a real UX gap.

## `GET /rates`

Not under `/wallet`, no session needed. USD-based exchange rates for the
header's display-currency selector — every USD value already returned
elsewhere (`/wallet/balances`, `/wallet/transactions`, `/wallet/withdraw/estimate`,
etc.) gets multiplied by `rates[code]` client-side to show in the user's
chosen currency; the backend never re-prices anything.

```jsonc
{
  "base": "USD",
  "rates": {
    "AUD": "1.43926900",
    "EUR": "0.88889000",
    "GBP": "0.75572700",
    "INR": "96.40063400"
    // ...~166 currencies total
  },
  "updatedAt": "2026-10-05T08:31:31Z"
}
```

The frontend always fetches the full table (no `?codes=` filter) — it's small
and the dropdown needs the full code list anyway — cached 5 minutes
(`staleTime`/`refetchInterval`), not session-scoped. `?codes=AUD,INR,...` is
supported server-side if a filtered call is ever useful, just unused today.

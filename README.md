# CoinDrop Wallet

The web companion to the [CoinDrop](https://coindrop.cc) tipping bot — log in
with the Discord account you already use with the bot and manage your coins
from a browser instead of Discord commands. The underlying bot now also tips
in Kick chat (`!tip`, `!bal`, `!link`, `!help`) alongside Discord and
Telegram — one shared balance across all three, managed from this wallet.

## What it does

- **Balances** — every coin you hold, with live USD values and a running total
- **Activity** — every tip, drop, deposit and withdrawal that's touched your
  account, filterable by coin and direction
- **Send** — transfer coins straight to another CoinDrop user by their
  CoinDrop ID (shown on their own **Profile** page) — instant, no network
  fees. Sending to several people at once? Upload a CSV (CoinDrop ID, Amount)
  and the wallet looks up every recipient before anything actually sends
- **Deposit** — an address (plus a memo or destination tag, when the coin
  needs one) for any supported coin
- **Withdraw** — a two-step flow: review the fee breakdown and a 30-second
  quote before anything actually moves, then live status until it's done
- **Notifications** — a bell in the header for deposits landing on your
  account, independent of the bot's own Discord/Telegram DMs
- **History** — dedicated deposit and withdrawal history, separate from the
  combined activity feed
- **Profile** — your CoinDrop ID, the number other users need to send you
  coins
- **Login** — Discord today; Telegram and Google are already built into the
  UI, waiting on their backend routes

## Getting started

```bash
npm install
npm run dev
```

That's it — `npm run dev` starts in **mock mode** by default, so the whole app
runs against fake data with a fake login, no backend required. To use real
data, set `VITE_API_URL` to a running backend and `VITE_USE_MOCK="false"` in
`.env`.

Other scripts: `npm run build`, `npm run lint`, `npm run preview`.

## How it's built

A single-page React app — React 19, Vite, TypeScript — styled with local CSS
Modules rather than a UI framework, using TanStack Query for data fetching and
React Router for navigation. The backend isn't in this repository; it's a
Flask service that lives elsewhere (see [Backend](#backend) below).

## Login

Login is a cookie session, not a token the frontend has to juggle. Clicking
"Continue with Discord" sends the browser to the backend's OAuth route; once
Discord confirms who you are, the backend sets an httpOnly session cookie and
sends you back here. From then on, every request just rides along with that
cookie — a `401` means you're logged out, and the app quietly sends you back
to the login screen.

## Backend

This app talks to a companion backend at `VITE_API_URL`. The full contract —
every endpoint, request/response shapes, and the conventions it follows — is
in [`docs/API.md`](docs/API.md). Short version: amounts are always
smallest-unit integers as strings, and errors always come back as
`{ "detail": "..." }`.

The deployment target is `wallet.coindrop.cc` on Vercel, paired with a Flask
backend on `backend.coindrop.cc`. The full runbook — cookie/CORS setup and a
working Flask route skeleton — is in [`deploy/DEPLOY.md`](deploy/DEPLOY.md).

## Project layout

```
src/
  api/         backend calls, types, and the mock layer used in local dev
  app/         router and the auth gate
  components/  shared UI — buttons, cards, the logo, loading/error states
  features/    one folder per domain (auth, wallet, notifications) — hooks + the components that use them
  lib/         formatting helpers, the query client
  pages/       one file per route
```

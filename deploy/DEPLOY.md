# Deploying — Vercel (frontend) + Flask (backend)

```
  wallet.coindrop.cc            api.coindrop.cc
  ┌───────────────────┐         ┌──────────────────────┐
  │  this SPA (Vercel) │  fetch  │  Flask               │
  │  withCredentials   │────────▶│  Discord OAuth        │
  │                    │◀────────│  session cookie       │
  └───────────────────┘  cookie  │  balances / txs       │
                                 └──────────┬───────────┘
                                            │
                                       CoinDrop MySQL
```

Both hosts are subdomains of `coindrop.cc`, so the session cookie is **same-site**:
`SameSite=Lax` is enough, no `SameSite=None`, no third-party-cookie problems.

## 1. Frontend on Vercel

- Import the repo. Vercel auto-detects Vite → build `npm run build`, output `dist/`.
- `vercel.json` (committed) rewrites all paths to `index.html` for client routing.
- **Env var** (Settings → Environment Variables, Production):
  `VITE_API_URL = https://api.coindrop.cc`
- Add the domain `wallet.coindrop.cc` (Settings → Domains); Vercel gives you the
  DNS record to add.

That's it — every push to `main` deploys.

## 2. Flask backend

Host it anywhere, but give it a **`coindrop.cc` subdomain** (`api.coindrop.cc`) so
the cookie stays same-site. Needs read access to CoinDrop's MySQL.

Config:

```python
app.config.update(
    SECRET_KEY=os.environ["SECRET_KEY"],
    SESSION_COOKIE_NAME="cd_wallet_session",
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SECURE=True,          # https only
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_DOMAIN=".coindrop.cc",  # shared across subdomains
)

from flask_cors import CORS
CORS(app,
     resources={r"/*": {"origins": "https://wallet.coindrop.cc"}},
     supports_credentials=True)

FRONTEND = "https://wallet.coindrop.cc"
DISCORD_REDIRECT_URI = "https://api.coindrop.cc/auth/discord/callback"
```

Routes (shapes → `../README.md`):

| Route | Does |
|---|---|
| `GET /auth/discord` | validate `?redirect` is on `coindrop.cc`, stash in session, 302 to Discord's authorize URL (`scope=identify`, `redirect_uri=DISCORD_REDIRECT_URI`) |
| `GET /auth/discord/callback` | exchange `code`; get the Discord user; resolve to an internal id (bot's `core_ops.resolve_or_create_user` / `resolve_canonical_id`); `session["uid"] = internal_id`; 302 to the stashed redirect (defaults to `FRONTEND + "/auth/callback"`) |
| `GET /auth/me` | `session["uid"]` → `{"user": {...}}` (200) or `{"detail": "..."}` (401) |
| `POST /auth/logout` | `session.clear()`; 204 |
| `GET /wallet/balances` | query `balances`/`currencies`/`price_cache` for `session["uid"]` |
| `GET /wallet/transactions` | query `transactions` (`from_user=uid OR to_user=uid`), join `users` for the counterparty name, `direction`/`currency` filters, `limit` + `offset` (the frontend's `cursor` is just a stringified offset) |

Skeleton:

```python
from flask import Flask, request, redirect, session, jsonify, abort

@app.get("/auth/discord")
def auth_discord():
    dest = request.args.get("redirect", FRONTEND + "/auth/callback")
    if urlparse(dest).hostname not in ("wallet.coindrop.cc", "coindrop.cc"):
        dest = FRONTEND + "/auth/callback"
    session["post_login"] = dest
    return redirect(discord_authorize_url())   # scope=identify

@app.get("/auth/discord/callback")
def auth_callback():
    token = exchange_code(request.args["code"])
    d = discord_me(token)                       # {id, username, avatar}
    session["uid"] = resolve_or_create_user("discord", int(d["id"]), d["username"])
    session["avatar"] = avatar_url(d)
    return redirect(session.pop("post_login", FRONTEND + "/auth/callback"))

def current_uid():
    uid = session.get("uid")
    if uid is None:
        abort(401, description="Not signed in")
    return resolve_canonical_id(uid)

@app.get("/auth/me")
def me():
    current_uid()
    return jsonify(user={
        "id": str(session["uid"]),
        "username": username_for(session["uid"]),
        "avatarUrl": session.get("avatar"),
        "platform": "discord",
    })

@app.post("/auth/logout")
def logout():
    session.clear()
    return "", 204

@app.get("/wallet/balances")
def balances():
    uid = current_uid()
    rows = db_balances(uid)   # -> [{currencyId, symbol, name, decimals, amount, usdValue}]
    total = sum(float(r["usdValue"]) for r in rows if r["usdValue"])
    return jsonify(totalUsd=f"{total:.2f}", balances=rows)

@app.get("/wallet/transactions")
def transactions():
    uid = current_uid()
    offset = int(request.args.get("cursor") or 0)
    limit = min(int(request.args.get("limit", 25)), 100)
    rows = db_transactions(uid, request.args.get("direction"),
                           request.args.get("currency"), limit + 1, offset)
    more = len(rows) > limit
    return jsonify(
        transactions=[to_tx(r, uid) for r in rows[:limit]],
        nextCursor=str(offset + limit) if more else None,
    )

# FastAPI-style error body the frontend already parses: {"detail": "..."}
@app.errorhandler(401)
def _401(e):
    return jsonify(detail=e.description), 401
```

- Discord OAuth app → **Redirects**: add `https://api.coindrop.cc/auth/discord/callback`.
- `avatar_url`: `https://cdn.discordapp.com/avatars/{id}/{hash}.png`, or return `null`.
- Amounts: pass the raw `balances.balance` string straight through; the frontend
  divides by `10**decimals`.
- If the host terminates TLS at a proxy, set `SESSION_COOKIE_SECURE` from
  `X-Forwarded-Proto` or use `ProxyFix`.

## 3. Go-live checklist

- [ ] Flask deployed at `https://api.coindrop.cc`, `curl -i .../auth/me` → 401 `{"detail":...}`
- [ ] Discord app redirect URI added
- [ ] Vercel project: domain `wallet.coindrop.cc`, env `VITE_API_URL=https://api.coindrop.cc`
- [ ] visit `https://wallet.coindrop.cc` → Login → Discord → back on `/wallet` with real balances
- [ ] `document.cookie` empty in devtools (cookie is HttpOnly) but requests carry it → Network tab shows `cookie:` on `/auth/me`
- [ ] hard-refresh `/wallet` → still loads (SPA rewrite working)

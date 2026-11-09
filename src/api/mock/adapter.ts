import { AxiosError, type AxiosAdapter, type AxiosResponse } from "axios";
import { MOCK_BALANCES, MOCK_TRANSACTIONS, MOCK_USER } from "./data";
import type { Swap, SwapQuote, Transaction, TransactionsResponse } from "../types";

/* A tiny in-browser stand-in for the wallet backend. Auth state lives in
 * sessionStorage so a page reload keeps you logged in but a new tab doesn't.
 * Covers auth + balances/transactions, plus swaps (an in-memory swap that
 * completes after a few stages) — deposit/withdraw go straight to the real
 * backend (VITE_USE_MOCK doesn't apply to those screens). */

const SESSION_KEY = "coindrop.mock.session";

export const mockSession = {
  isActive: () => {
    try {
      return sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      return false;
    }
  },
  start: () => {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore */
    }
  },
  end: () => {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  },
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const PAGE_SIZE = 8;

function transactionsPage(params: URLSearchParams): TransactionsResponse {
  const direction = params.get("direction"); // received | sent | all
  const currency = params.get("currency");
  const cursor = params.get("cursor");

  let rows: Transaction[] = MOCK_TRANSACTIONS;
  if (direction === "received") rows = rows.filter((t) => t.direction === "in");
  if (direction === "sent") rows = rows.filter((t) => t.direction === "out");
  if (currency) rows = rows.filter((t) => t.symbol === currency);

  const start = cursor ? Number(cursor) : 0;
  const slice = rows.slice(start, start + PAGE_SIZE);
  const next = start + PAGE_SIZE;
  return {
    transactions: slice,
    nextCursor: next < rows.length ? String(next) : null,
  };
}

/* ── swaps: an in-memory swap that walks through each stage on a clock ── */
const SWAP_ASSETS = [
  { currencyId: 1, symbol: "BTC", decimals: 8, chainName: "Bitcoin", usd: 98000 },
  { currencyId: 2, symbol: "ETH", decimals: 18, chainName: "Ethereum", usd: 3200 },
  { currencyId: 3, symbol: "SOL", decimals: 9, chainName: "Solana", usd: 180 },
  { currencyId: 4, symbol: "LTC", decimals: 8, chainName: "Litecoin", usd: 95 },
  { currencyId: 6, symbol: "USDC", decimals: 6, chainName: "Ethereum", usd: 1 },
];
const MOCK_SWAP_STAGE_MS = 6000;
const mockSwaps: (Swap & { startedAt: number })[] = [];

function mockQuote(body: { fromSymbol: string; toSymbol: string; amount: string }): SwapQuote | null {
  const from = SWAP_ASSETS.find((a) => a.symbol === body.fromSymbol);
  const to = SWAP_ASSETS.find((a) => a.symbol === body.toSymbol);
  if (!from || !to) return null;
  const usdIn = (Number(body.amount) / 10 ** from.decimals) * from.usd;
  const out = (usdIn * 0.985) / to.usd; // ~1% CoinDrop fee + venue costs
  const sameChain = from.chainName === to.chainName;
  const toUnits = (v: number) => BigInt(Math.floor(v * 10 ** Math.min(to.decimals, 12))) * 10n ** BigInt(Math.max(0, to.decimals - 12));
  // ~$0.40 of gas to send it out of the hot wallet, in the from-coin's units.
  const fee = BigInt(Math.floor((0.4 / from.usd) * 10 ** Math.min(from.decimals, 12))) * 10n ** BigInt(Math.max(0, from.decimals - 12));
  const swapAmount = BigInt(body.amount) - fee;
  if (swapAmount <= 0n) return null;
  return {
    token: btoa(JSON.stringify({ ...body, fee: fee.toString(), out: toUnits(out).toString(), min: toUnits(out * 0.99).toString() })),
    from: { symbol: from.symbol, decimals: from.decimals, amount: body.amount, swapAmount: swapAmount.toString() },
    to: { symbol: to.symbol, decimals: to.decimals, amount: toUnits(out).toString(), minAmount: toUnits(out * 0.99).toString() },
    networkFee: fee.toString(),
    feeBps: 100,
    etaSeconds: sameChain ? 30 : 75,
    amountUsd: usdIn.toFixed(2),
    receiveUsd: (out * to.usd).toFixed(2),
    expiresInSeconds: 600,
  };
}

function advance(swap: Swap & { startedAt: number }): Swap {
  const age = Date.now() - swap.startedAt;
  if (swap.status === "pending") {
    const stages = ["awaiting_deposit", "confirming", "exchanging"] as const;
    const i = Math.floor(age / MOCK_SWAP_STAGE_MS);
    if (i < stages.length) swap.progress = stages[i];
    else Object.assign(swap, { status: "completed", progress: "completed", amountOut: swap.expectedOut, settledAt: new Date().toISOString() });
  }
  const rest: Swap & { startedAt?: number } = { ...swap };
  delete rest.startedAt;
  return rest;
}

function ok(data: unknown, config: Parameters<AxiosAdapter>[0]): AxiosResponse {
  return {
    data,
    status: 200,
    statusText: "OK",
    headers: {},
    config,
    request: {},
  };
}

function fail(status: number, detail: string, config: Parameters<AxiosAdapter>[0]): never {
  throw new AxiosError(
    detail,
    status === 401 ? "ERR_UNAUTHENTICATED" : "ERR_BAD_RESPONSE",
    config,
    {},
    {
      data: { detail },
      status,
      statusText: detail,
      headers: {},
      config,
    } as AxiosResponse,
  );
}

export const mockAdapter: AxiosAdapter = async (config) => {
  const method = (config.method ?? "get").toLowerCase();
  const raw = config.url ?? "";
  const url = new URL(raw, "http://mock.local");
  const path = url.pathname.replace(/\/$/, "");

  // axios hands a custom adapter its `params` separately from the URL —
  // fold them in so route handlers see one query bag.
  const params = (config.params ?? {}) as Record<string, unknown>;
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  }

  await delay(260 + Math.random() * 260);

  if (path === "/auth/me" && method === "get") {
    if (!mockSession.isActive()) fail(401, "Not signed in", config);
    return ok({ user: MOCK_USER }, config);
  }

  if (path === "/auth/logout" && method === "post") {
    mockSession.end();
    return ok({ ok: true }, config);
  }

  if (path === "/wallet/balances" && method === "get") {
    if (!mockSession.isActive()) fail(401, "Not signed in", config);
    return ok(MOCK_BALANCES, config);
  }

  if (path === "/wallet/transactions" && method === "get") {
    if (!mockSession.isActive()) fail(401, "Not signed in", config);
    return ok(transactionsPage(url.searchParams), config);
  }

  if (path.startsWith("/wallet/swap") && !mockSession.isActive()) fail(401, "Not signed in", config);

  if (path === "/wallet/swap/assets" && method === "get") {
    const assets = SWAP_ASSETS.map((a) => ({ currencyId: a.currencyId, symbol: a.symbol, decimals: a.decimals, chainName: a.chainName }));
    return ok({ assets, feeBps: 100 }, config);
  }

  if (path === "/wallet/swap/quote" && method === "post") {
    const body = JSON.parse(String(config.data ?? "{}"));
    // Typing 13 shows the "no route" message.
    const quote = Number(body.amount) > 0 && !String(body.amount).startsWith("13") ? mockQuote(body) : null;
    if (!quote) fail(422, "No route found for this swap right now.", config);
    return ok(quote, config);
  }

  if (path === "/wallet/swap/confirm" && method === "post") {
    const q = JSON.parse(atob(JSON.parse(String(config.data ?? "{}")).token));
    const from = SWAP_ASSETS.find((a) => a.symbol === q.fromSymbol)!;
    const to = SWAP_ASSETS.find((a) => a.symbol === q.toSymbol)!;
    const swap = {
      id: mockSwaps.length + 1, status: "pending" as const, progress: "awaiting_deposit" as const,
      fromSymbol: from.symbol, toSymbol: to.symbol, fromDecimals: from.decimals, toDecimals: to.decimals,
      amountIn: q.amount, networkFee: q.fee, expectedOut: q.out, minOut: q.min, amountOut: null, feeBps: 100,
      depositTxHash: null, createdAt: new Date().toISOString(), settledAt: null, startedAt: Date.now(),
    };
    mockSwaps.unshift(swap);
    return ok({ swap: advance(swap) }, config);
  }

  if (path === "/wallet/swap" && method === "get") {
    return ok({ swaps: mockSwaps.map(advance), nextCursor: null }, config);
  }

  const swapMatch = path.match(/^\/wallet\/swap\/(\d+)$/);
  if (swapMatch && method === "get") {
    const swap = mockSwaps.find((s) => s.id === Number(swapMatch[1]));
    if (!swap) fail(404, "Swap not found.", config);
    return ok(advance(swap), config);
  }

  fail(404, `No mock handler for ${method.toUpperCase()} ${path}`, config);
};

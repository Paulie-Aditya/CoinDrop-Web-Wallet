import { AxiosError, type AxiosAdapter, type AxiosResponse } from "axios";
import { MOCK_BALANCES, MOCK_TRANSACTIONS, MOCK_USER } from "./data";
import type { Transaction, TransactionsResponse } from "../types";

/* A tiny in-browser stand-in for the wallet backend. Auth state lives in
 * sessionStorage so a page reload keeps you logged in but a new tab doesn't. */

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

function fail(status: number, message: string, config: Parameters<AxiosAdapter>[0]): never {
  throw new AxiosError(
    message,
    status === 401 ? "ERR_UNAUTHENTICATED" : "ERR_BAD_RESPONSE",
    config,
    {},
    {
      data: { message },
      status,
      statusText: message,
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

  fail(404, `No mock handler for ${method.toUpperCase()} ${path}`, config);
};

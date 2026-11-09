import axios from "axios";
import { API_URL, USE_MOCK } from "./config";
import { mockAdapter } from "./mock/adapter";

/** One axios instance for the whole app.
 *  Real mode: cookie session (withCredentials), no token handling in JS.
 *  Mock mode: requests never leave the browser. */
export const http = axios.create({
  baseURL: USE_MOCK ? "" : API_URL,
  withCredentials: true,
  headers: { Accept: "application/json" },
  ...(USE_MOCK ? { adapter: mockAdapter } : {}),
});

export interface ApiError {
  status: number | null;
  message: string;
  /** on a 429: seconds until the backend takes this request again */
  retryAfter: number | null;
}

export function toApiError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status ?? null;
    const data = err.response?.data as { detail?: string; retryAfter?: number } | undefined;
    return { status, message: data?.detail ?? err.message, retryAfter: data?.retryAfter ?? null };
  }
  return { status: null, message: "Something went wrong", retryAfter: null };
}

/** Runs `fn`, and when the backend answers 429 waits as long as it asks and
 *  tries again — for loops that send many requests in a row (bulk send). */
export async function withRateLimitRetry<T>(fn: () => Promise<T>, maxWaits = 20): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const { status, retryAfter } = toApiError(err);
      if (status !== 429 || attempt >= maxWaits) throw err;
      await new Promise((resolve) => setTimeout(resolve, Math.min(retryAfter ?? 5, 120) * 1000));
    }
  }
}

export function isUnauthenticated(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 401;
}

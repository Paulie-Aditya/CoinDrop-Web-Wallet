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
}

export function toApiError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status ?? null;
    const data = err.response?.data as { detail?: string } | undefined;
    return { status, message: data?.detail ?? err.message };
  }
  return { status: null, message: "Something went wrong" };
}

export function isUnauthenticated(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 401;
}

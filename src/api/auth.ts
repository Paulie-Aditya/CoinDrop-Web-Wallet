import { API_URL, USE_MOCK } from "./config";
import { http } from "./http";
import { mockSession } from "./mock/adapter";
import type { AuthPlatform, SessionUser } from "./types";

export async function fetchSession(): Promise<SessionUser> {
  const { data } = await http.get<{ user: SessionUser }>("/auth/me");
  return data.user;
}

export async function logout(): Promise<void> {
  await http.post("/auth/logout");
}

export interface AuthProvider {
  id: AuthPlatform;
  label: string;
  /** false while the backend integration is still being wired up */
  enabled: boolean;
}

export const AUTH_PROVIDERS: AuthProvider[] = [
  { id: "discord", label: "Discord", enabled: true },
  { id: "telegram", label: "Telegram", enabled: false },
  { id: "google", label: "Google", enabled: false },
];

/** Full-page redirect into the backend OAuth flow. In mock mode we just flip
 *  the fake session on and bounce through the callback route. */
export function startLogin(provider: AuthPlatform, redirectPath = "/auth/callback"): void {
  if (USE_MOCK) {
    mockSession.start();
    window.location.assign(redirectPath);
    return;
  }
  // API_URL is "" for the same-origin (nginx-proxied) deploy, or a full host.
  const url = new URL(`${API_URL}/auth/${provider}`, window.location.origin);
  url.searchParams.set("redirect", window.location.origin + redirectPath);
  window.location.assign(url.toString());
}

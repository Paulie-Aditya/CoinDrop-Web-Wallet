import type { SwapProgress } from "../../api/types";

const VENUES: Record<string, string> = {
  "near-intents": "NEAR Intents",
  swapkit: "SwapKit",
  uniswap: "Uniswap",
};

const PROVIDERS: Record<string, string> = {
  near: "NEAR Intents",
};

/** "swapkit" + "near" -> "SwapKit · NEAR Intents"; multi-hop providers join with →. */
export function routeLabel(venue: string, provider: string | null): string {
  const name = VENUES[venue] ?? venue;
  if (!provider) return name;
  const hops = provider
    .split("+")
    .map((p) => PROVIDERS[p] ?? p.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(" → ");
  return `${name} · ${hops}`;
}

export function etaLabel(seconds: number): string {
  if (!seconds) return "A few minutes";
  if (seconds < 90) return `About ${Math.max(1, Math.round(seconds))}s`;
  return `About ${Math.round(seconds / 60)} min`;
}

export function feeLabel(bps: number): string {
  return `${(bps / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;
}

export const PROGRESS_COPY: Record<SwapProgress, string> = {
  awaiting_deposit: "Sending your coins to the swap",
  confirming: "Waiting for network confirmations",
  exchanging: "Swapping",
  completed: "Crediting your balance",
  refunded: "Returning your coins",
  failed: "Returning your coins",
  expired: "Checking on your swap",
};

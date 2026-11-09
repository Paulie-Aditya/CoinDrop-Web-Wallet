import type { SwapProgress } from "../../api/types";

/** Users only ever see this; which venue CrossFare used stays in the database. */
export const ROUTE_NAME = "Crossfare";

/** Groups coins by chain: CoinDrop's chain id, or its name on older backends. */
export function chainKey(c: { chainId?: number; chainName: string }): string {
  return c.chainId !== undefined ? String(c.chainId) : c.chainName;
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

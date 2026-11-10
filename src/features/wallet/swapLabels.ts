import { formatUnits } from "../../lib/format";
import type { SwapProgress, SwapStatusValue } from "../../api/types";

/** The routing service. Each swap also names the venues it goes through (routeLabel). */
export const ROUTE_NAME = "Crossfare";

/** "PancakeSwap", or "2 steps: CHAINFLIP, then Uniswap, through 0.2 ETH". */
export function routeLabel(
  steps: string[] | undefined,
  hub?: { symbol: string; decimals: number; amount?: string | null } | null,
): string {
  if (!steps?.length) return ROUTE_NAME;
  if (steps.length === 1) return steps[0];
  const through = hub
    ? `, through ${hub.amount ? `${formatUnits(hub.amount, hub.decimals)} ` : ""}${hub.symbol}`
    : "";
  return `${steps.length} steps: ${steps.slice(0, -1).join(", ")}, then ${steps[steps.length - 1]}${through}`;
}

/** Groups coins by chain: CoinDrop's chain id, or its name on older backends. */
export function chainKey(c: { chainId?: number; chainName: string }): string {
  return c.chainId !== undefined ? String(c.chainId) : c.chainName;
}

/** chain key -> the symbol of that chain's own coin, for the badge on its tokens. */
export function chainIconsFor(
  coins: { chainId?: number | null; chainName?: string | null; isToken?: boolean; symbol: string }[],
): Map<string, string> {
  const icons = new Map<string, string>();
  for (const c of coins) {
    if (c.isToken === false) icons.set(chainKey({ chainId: c.chainId ?? undefined, chainName: c.chainName ?? "" }), c.symbol);
  }
  return icons;
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
  awaiting_next_leg: "Starting the second step",
  confirming: "Waiting for network confirmations",
  exchanging: "Swapping",
  completed: "Crediting your balance",
  refunded: "Returning your coins",
  failed: "Returning your coins",
  expired: "Checking on your swap",
};

export const STATUS_LABEL: Record<SwapStatusValue, string> = {
  pending: "In progress",
  completed: "Completed",
  refunded: "Refunded",
  needs_review: "Under review",
  hub_credited: "Stopped halfway",
};

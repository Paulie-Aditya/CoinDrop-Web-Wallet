import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { confirmSwap, fetchSwap, fetchSwapAssets, fetchSwaps, quoteSwap } from "../../api/wallet";
import { queryClient } from "../../lib/queryClient";
import type { SwapQuoteInput } from "../../api/types";

export const swapsKey = ["wallet", "swaps"] as const;

export function useSwapAssets() {
  return useQuery({
    queryKey: ["wallet", "swap", "assets"],
    queryFn: fetchSwapAssets,
    // Which coins can be swapped changes rarely; the backend caches it for an hour.
    staleTime: 30 * 60_000,
  });
}

/** How often a shown quote is re-priced; well inside the backend's quote lifetime. */
export const QUOTE_REFRESH_MS = 45_000;

export const quoteKey = (input: SwapQuoteInput | null) =>
  ["wallet", "swap", "quote", input?.fromSymbol, input?.toSymbol, input?.amount] as const;

/** A live price for the pair and amount, re-quoted every QUOTE_REFRESH_MS
 *  while the page is visible. `paused` holds it still while a swap starts. */
export function useLiveSwapQuote(input: SwapQuoteInput | null, paused: boolean) {
  return useQuery({
    queryKey: quoteKey(input),
    queryFn: () => quoteSwap(input as SwapQuoteInput),
    enabled: input !== null,
    retry: false,
    staleTime: QUOTE_REFRESH_MS,
    gcTime: QUOTE_REFRESH_MS,
    refetchOnWindowFocus: false,
    refetchInterval: paused ? false : QUOTE_REFRESH_MS,
  });
}

/** Balance and history change the moment a swap starts and again when it settles. */
export function refreshAfterSwap() {
  void queryClient.invalidateQueries({ queryKey: ["wallet", "balances"] });
  void queryClient.invalidateQueries({ queryKey: swapsKey });
}

export function useSwapConfirm() {
  return useMutation({
    mutationFn: (token: string) => confirmSwap(token),
    onSuccess: refreshAfterSwap,
  });
}

export function useSwaps() {
  return useInfiniteQuery({
    queryKey: swapsKey,
    queryFn: ({ pageParam }) => fetchSwaps(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}

/** Polls a pending swap; each read also lets the backend settle it. */
export function useSwapStatus(id: number | null) {
  return useQuery({
    queryKey: ["wallet", "swap", id],
    queryFn: () => fetchSwap(id as number),
    enabled: id !== null,
    retry: false,
    refetchInterval: (query) => (query.state.data?.status === "pending" ? 8000 : false),
  });
}

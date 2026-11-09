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

export function useSwapQuote() {
  return useMutation({ mutationFn: (input: SwapQuoteInput) => quoteSwap(input) });
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

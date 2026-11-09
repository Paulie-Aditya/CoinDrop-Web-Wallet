import { useQuery } from "@tanstack/react-query";
import { fetchBalances, fetchCurrencies } from "../../api/wallet";

export const balancesKey = ["wallet", "balances"] as const;

/** Every coin CoinDrop supports; changes only when a coin is added. */
export function useCurrencies() {
  return useQuery({
    queryKey: ["wallet", "currencies"],
    queryFn: fetchCurrencies,
    staleTime: 30 * 60_000,
    retry: false,
  });
}

export function useBalances() {
  return useQuery({
    queryKey: balancesKey,
    queryFn: fetchBalances,
  });
}

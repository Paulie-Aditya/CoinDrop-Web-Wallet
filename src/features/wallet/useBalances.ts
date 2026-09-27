import { useQuery } from "@tanstack/react-query";
import { fetchBalances } from "../../api/wallet";

export const balancesKey = ["wallet", "balances"] as const;

export function useBalances() {
  return useQuery({
    queryKey: balancesKey,
    queryFn: fetchBalances,
  });
}

/** Several endpoints (notifications, deposit/withdraw history) return amounts
 *  without a `decimals` field — resolve it by symbol against balances. */
export function useDecimalsBySymbol(): Map<string, number> {
  const { data } = useBalances();
  return new Map((data?.balances ?? []).map((b) => [b.symbol, b.decimals]));
}

import { useQuery } from "@tanstack/react-query";
import { fetchBalances } from "../../api/wallet";

export const balancesKey = ["wallet", "balances"] as const;

export function useBalances() {
  return useQuery({
    queryKey: balancesKey,
    queryFn: fetchBalances,
  });
}

import { useQuery } from "@tanstack/react-query";
import { fetchDepositAddress } from "../../api/wallet";

export function useDepositAddress(symbol: string | null) {
  return useQuery({
    queryKey: ["wallet", "deposit", symbol],
    queryFn: () => fetchDepositAddress(symbol as string),
    enabled: !!symbol,
    retry: false,
    staleTime: 5 * 60_000,
  });
}

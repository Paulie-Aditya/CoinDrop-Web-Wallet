import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchDepositHistory, fetchWithdrawHistory } from "../../api/wallet";

export function useDepositHistory(currency: string | null) {
  return useInfiniteQuery({
    queryKey: ["wallet", "deposits", currency ?? "*"],
    queryFn: ({ pageParam }) => fetchDepositHistory({ currency, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}

export function useWithdrawHistory(currency: string | null) {
  return useInfiniteQuery({
    queryKey: ["wallet", "withdrawals", currency ?? "*"],
    queryFn: ({ pageParam }) => fetchWithdrawHistory({ currency, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}

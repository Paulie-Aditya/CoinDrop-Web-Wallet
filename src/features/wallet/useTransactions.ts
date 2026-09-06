import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchTransactions } from "../../api/wallet";
import type { TxFilter } from "../../api/types";

export function transactionsKey(filter: TxFilter, currency: string | null) {
  return ["wallet", "transactions", filter, currency ?? "*"] as const;
}

export function useTransactions(filter: TxFilter, currency: string | null) {
  return useInfiniteQuery({
    queryKey: transactionsKey(filter, currency),
    queryFn: ({ pageParam }) =>
      fetchTransactions({ filter, currency, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}

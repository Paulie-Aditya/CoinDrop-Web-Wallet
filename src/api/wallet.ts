import { http } from "./http";
import type { BalancesResponse, TransactionsResponse, TxFilter } from "./types";

export async function fetchBalances(): Promise<BalancesResponse> {
  const { data } = await http.get<BalancesResponse>("/wallet/balances");
  return data;
}

export interface TransactionQuery {
  filter: TxFilter;
  currency: string | null;
  cursor: string | null;
}

export async function fetchTransactions(
  query: TransactionQuery,
): Promise<TransactionsResponse> {
  const params: Record<string, string> = {};
  if (query.filter !== "all") params.direction = query.filter;
  if (query.currency) params.currency = query.currency;
  if (query.cursor) params.cursor = query.cursor;
  const { data } = await http.get<TransactionsResponse>("/wallet/transactions", {
    params,
  });
  return data;
}

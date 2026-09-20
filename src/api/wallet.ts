import { http } from "./http";
import type {
  BalancesResponse,
  DepositAddress,
  TransactionsResponse,
  TxFilter,
  WithdrawConfirmResult,
  WithdrawEstimate,
  WithdrawEstimateInput,
} from "./types";

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

export async function fetchDepositAddress(symbol: string): Promise<DepositAddress> {
  const { data } = await http.get<DepositAddress>(
    `/wallet/deposit/${encodeURIComponent(symbol)}`,
  );
  return data;
}

export async function estimateWithdrawal(
  input: WithdrawEstimateInput,
): Promise<WithdrawEstimate> {
  const { data } = await http.post<WithdrawEstimate>("/wallet/withdraw/estimate", input);
  return data;
}

export async function confirmWithdrawal(token: string): Promise<WithdrawConfirmResult> {
  const { data } = await http.post<WithdrawConfirmResult>("/wallet/withdraw/confirm", {
    token,
  });
  return data;
}

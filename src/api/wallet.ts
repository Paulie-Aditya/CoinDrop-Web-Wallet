import { http } from "./http";
import type {
  BalancesResponse,
  DepositAddress,
  DepositsResponse,
  TransactionsResponse,
  TxFilter,
  WithdrawConfirmResult,
  WithdrawEstimate,
  WithdrawEstimateInput,
  WithdrawStatus,
  WithdrawStatusValue,
  WithdrawalsResponse,
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

export async function fetchWithdrawStatus(id: string): Promise<WithdrawStatus> {
  const { data } = await http.get<WithdrawStatus>(
    `/wallet/withdraw/${encodeURIComponent(id)}`,
  );
  return data;
}

export interface DepositHistoryQuery {
  currency?: string | null;
  cursor?: string | null;
  limit?: number;
}

export async function fetchDepositHistory(
  query: DepositHistoryQuery = {},
): Promise<DepositsResponse> {
  const params: Record<string, string> = {};
  if (query.currency) params.currency = query.currency;
  if (query.cursor) params.cursor = query.cursor;
  if (query.limit) params.limit = String(query.limit);
  const { data } = await http.get<DepositsResponse>("/wallet/deposits", { params });
  return data;
}

export interface WithdrawHistoryQuery {
  currency?: string | null;
  status?: WithdrawStatusValue | null;
  cursor?: string | null;
  limit?: number;
}

export async function fetchWithdrawHistory(
  query: WithdrawHistoryQuery = {},
): Promise<WithdrawalsResponse> {
  const params: Record<string, string> = {};
  if (query.currency) params.currency = query.currency;
  if (query.status) params.status = query.status;
  if (query.cursor) params.cursor = query.cursor;
  if (query.limit) params.limit = String(query.limit);
  const { data } = await http.get<WithdrawalsResponse>("/wallet/withdraw", { params });
  return data;
}

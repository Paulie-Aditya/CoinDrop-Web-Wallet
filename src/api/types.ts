/** Shapes the frontend expects from the CoinDrop wallet backend.
 *  Amounts that come from the ledger are DECIMAL(65,0) integers in the
 *  currency's smallest unit — always carried as strings, never numbers. */

export type AuthPlatform = "discord" | "telegram" | "google";

export interface SessionUser {
  id: string;
  username: string;
  avatarUrl: string | null;
  platform: AuthPlatform;
}

export interface Balance {
  currencyId: number;
  symbol: string;
  name: string;
  decimals: number;
  /** smallest-unit integer, as a string */
  amount: string;
  /** USD value of `amount`, as a decimal string; null if the coin has no price */
  usdValue: string | null;
}

export interface BalancesResponse {
  /** sum of every balance's usdValue, decimal string */
  totalUsd: string;
  balances: Balance[];
}

export type TxDirection = "in" | "out";

export type TxKind =
  | "tip"
  | "airdrop"
  | "raffle"
  | "quickdrop"
  | "slowdrop"
  | "mathtip"
  | "triviadrop"
  | "swap"
  | "deposit"
  | "withdrawal";

export interface Transaction {
  id: string;
  direction: TxDirection;
  kind: TxKind;
  /** the other party's username, when there is one */
  counterparty: string | null;
  symbol: string;
  decimals: number;
  amount: string;
  usdValue: string | null;
  /** ISO 8601 */
  timestamp: string;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  nextCursor: string | null;
}

export type TxFilter = "all" | "received" | "sent";

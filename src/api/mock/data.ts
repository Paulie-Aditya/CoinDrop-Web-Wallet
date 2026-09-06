import type {
  Balance,
  BalancesResponse,
  SessionUser,
  Transaction,
} from "../types";

export const MOCK_USER: SessionUser = {
  id: "308453391777202176",
  username: "nova",
  avatarUrl: null,
  platform: "discord",
};

interface CoinDef {
  currencyId: number;
  symbol: string;
  name: string;
  decimals: number;
}

const COINS: Record<string, CoinDef> = {
  BTC: { currencyId: 1, symbol: "BTC", name: "Bitcoin", decimals: 8 },
  ETH: { currencyId: 2, symbol: "ETH", name: "Ethereum", decimals: 18 },
  SOL: { currencyId: 3, symbol: "SOL", name: "Solana", decimals: 9 },
  LTC: { currencyId: 4, symbol: "LTC", name: "Litecoin", decimals: 8 },
  DOGE: { currencyId: 5, symbol: "DOGE", name: "Dogecoin", decimals: 8 },
  USDC: { currencyId: 6, symbol: "USDC", name: "USD Coin", decimals: 6 },
  XRP: { currencyId: 7, symbol: "XRP", name: "XRP", decimals: 6 },
  TRX: { currencyId: 8, symbol: "TRX", name: "Tron", decimals: 6 },
  WAXP: { currencyId: 9, symbol: "WAXP", name: "WAX", decimals: 8 },
};

const balance = (sym: keyof typeof COINS, amount: string, usdValue: string): Balance => ({
  ...COINS[sym],
  amount,
  usdValue,
});

const BALANCES: Balance[] = [
  balance("BTC", "4120000", "2636.80"),
  balance("ETH", "750000000000000000", "2325.00"),
  balance("SOL", "12400000000", "1798.00"),
  balance("DOGE", "421000000000", "505.20"),
  balance("USDC", "340500000", "340.50"),
  balance("TRX", "900000000", "117.00"),
  balance("XRP", "210000000", "109.20"),
  balance("LTC", "320000000", "262.40"),
  balance("WAXP", "150000000000", "67.50"),
];

export const MOCK_BALANCES: BalancesResponse = {
  totalUsd: "8161.60",
  balances: BALANCES,
};

const HOUR = 3600_000;
const ago = (hours: number) => new Date(Date.now() - hours * HOUR).toISOString();

type TxSeed = [
  id: string,
  dir: Transaction["direction"],
  kind: Transaction["kind"],
  counterparty: string | null,
  sym: keyof typeof COINS,
  amount: string,
  usd: string | null,
  hoursAgo: number,
];

const TX_SEEDS: TxSeed[] = [
  ["tx_2f1a", "in", "tip", "quill", "USDC", "25000000", "25.00", 3],
  ["tx_2e9c", "in", "airdrop", "moonbase", "DOGE", "12000000000", "14.40", 9],
  ["tx_2e04", "out", "tip", "pixeljunk", "SOL", "500000000", "72.50", 21],
  ["tx_2d77", "in", "tip", "casraw", "BTC", "60000", "38.40", 33],
  ["tx_2cb0", "out", "withdrawal", null, "LTC", "150000000", "123.00", 52],
  ["tx_2c12", "in", "deposit", null, "ETH", "400000000000000000", "1240.00", 76],
  ["tx_2b41", "in", "raffle", "guild-night", "TRX", "300000000", "39.00", 98],
  ["tx_2a8e", "out", "tip", "loriann", "DOGE", "5000000000", "6.00", 121],
  ["tx_29d0", "in", "tip", "sixgg", "XRP", "80000000", "41.60", 140],
  ["tx_2911", "out", "swap", null, "USDC", "100000000", "100.00", 168],
  ["tx_2860", "in", "swap", null, "SOL", "690000000", "100.05", 168],
  ["tx_2745", "in", "quickdrop", "dropbot", "WAXP", "50000000000", "22.50", 205],
  ["tx_2699", "out", "tip", "mechasun", "BTC", "18000", "11.52", 244],
  ["tx_2570", "in", "mathtip", "trivia-hour", "USDC", "3000000", "3.00", 300],
];

const DECIMALS_BY_SYMBOL: Record<string, number> = Object.fromEntries(
  Object.values(COINS).map((c) => [c.symbol, c.decimals]),
);

export const MOCK_TRANSACTIONS: Transaction[] = TX_SEEDS.map(
  ([id, direction, kind, counterparty, sym, amount, usdValue, hoursAgo]) => ({
    id,
    direction,
    kind,
    counterparty,
    symbol: COINS[sym].symbol,
    decimals: DECIMALS_BY_SYMBOL[COINS[sym].symbol],
    amount,
    usdValue,
    timestamp: ago(hoursAgo),
  }),
);

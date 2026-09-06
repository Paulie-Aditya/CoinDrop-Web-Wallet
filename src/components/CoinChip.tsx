import styles from "./CoinChip.module.css";

/* CoinDrop stores coin emoji as Discord custom-emoji markup, which is useless
 * on the web — so we render a monogram on a stable per-symbol colour instead.
 * A few well-known coins get their real brand colour; the rest hash to one of
 * a fixed set (same spirit as the bot's Telegram colour-circle fallback). */

const BRAND: Record<string, string> = {
  BTC: "#f7931a",
  ETH: "#8a92b2",
  SOL: "#14f195",
  LTC: "#345d9d",
  DOGE: "#c3a634",
  USDC: "#2775ca",
  USDT: "#26a17b",
  XRP: "#23292f",
  TRX: "#eb0029",
  BNB: "#f0b90b",
  WAXP: "#f89022",
  BAN: "#fbdd11",
  AVAX: "#e84142",
  MATIC: "#8247e5",
  BASE: "#0052ff",
};

const PALETTE = [
  "#3b82f6",
  "#0ea5e9",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
  "#10b981",
  "#eab308",
  "#ef4444",
];

function pick(symbol: string): string {
  const brand = BRAND[symbol];
  if (brand && /^#[0-9a-f]{6}$/i.test(brand)) return brand;
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) hash = (hash * 31 + symbol.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

interface CoinChipProps {
  symbol: string;
  size?: number;
}

export function CoinChip({ symbol, size = 36 }: CoinChipProps) {
  const bg = pick(symbol);
  const label = symbol.replace(/[^A-Z0-9]/gi, "").slice(0, 4);
  const scale = label.length >= 4 ? 0.24 : label.length === 3 ? 0.3 : 0.38;
  return (
    <span
      className={styles.chip}
      style={{ width: size, height: size, background: bg, fontSize: size * scale }}
      aria-hidden="true"
    >
      {label}
    </span>
  );
}

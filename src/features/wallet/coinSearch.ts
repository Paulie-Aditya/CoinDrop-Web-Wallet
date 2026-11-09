/** Ranking for the coin picker's search: best match first, not alphabetical. */

export interface SearchableCoin {
  symbol: string;
  chainName: string;
  isToken?: boolean;
  /** smallest units; set when the user holds some */
  balance?: string;
}

/** Lower is better; null = no match. A native coin is named after its chain
 *  ("Solana" is SOL), so "sol" and "solana" both put SOL first and Solana's
 *  tokens after it. */
function score(c: SearchableCoin, q: string): number | null {
  const symbol = c.symbol.toLowerCase();
  const chain = c.chainName.toLowerCase();
  const native = c.isToken !== true;
  if (symbol === q) return 0;
  if (native && chain.startsWith(q)) return 1;
  if (symbol.startsWith(q)) return 2;
  if (native && chain.includes(q)) return 3;
  if (chain.startsWith(q)) return 4; // a token on a matching chain
  if (symbol.includes(q)) return 5;
  if (chain.includes(q)) return 6;
  return null;
}

const held = (c: SearchableCoin) => (c.balance && /[1-9]/.test(c.balance) ? 0 : 1);

/** Coins matching `query`, best first; with no query, coins you hold first. Ties
 *  go to coins you hold, then a chain's own coin before its tokens, then A–Z. */
export function rankCoins<T extends SearchableCoin>(coins: T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  const scored = coins
    .map((c, i) => ({ c, i, s: q ? score(c, q) : 0 }))
    .filter((x): x is { c: T; i: number; s: number } => x.s !== null);
  scored.sort(
    (a, b) =>
      a.s - b.s ||
      held(a.c) - held(b.c) ||
      Number(a.c.isToken === true) - Number(b.c.isToken === true) ||
      a.c.symbol.localeCompare(b.c.symbol) ||
      a.i - b.i,
  );
  return scored.map((x) => x.c);
}

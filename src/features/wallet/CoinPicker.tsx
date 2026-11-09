import { useEffect, useRef, useState } from "react";
import { CoinChip } from "../../components/CoinChip";
import { Icon } from "../../components/Icon";
import { formatUnits } from "../../lib/format";
import { chainKey } from "./swapLabels";
import { rankCoins } from "./coinSearch";
import styles from "./CoinPicker.module.css";

export interface PickerCoin {
  symbol: string;
  chainName: string;
  /** set by newer backends; groups coins into chains and draws the chain badge */
  chainId?: number;
  isToken?: boolean;
  decimals: number;
  /** smallest units; omitted when the user holds none */
  balance?: string;
}

/** A coin's icon, with its chain's coin as a small badge when it's a token on that chain. */
export function CoinMark({ coin, size, chainIcon }: { coin: PickerCoin; size: number; chainIcon?: string }) {
  const badge = coin.isToken && chainIcon && chainIcon !== coin.symbol;
  return (
    <span className={styles.mark} style={{ width: size, height: size }} aria-hidden="true">
      <CoinChip symbol={coin.symbol} size={size} />
      {badge && (
        <span className={styles.badge}>
          <CoinChip symbol={chainIcon} size={Math.round(size * 0.46)} />
        </span>
      )}
    </span>
  );
}

interface CoinPickerProps {
  title: string;
  coins: PickerCoin[];
  selected?: string;
  /** chain key (chainId, or chainName on older backends) -> the symbol of that chain's own coin */
  chainIcons: Map<string, string>;
  onPick: (symbol: string) => void;
  onClose: () => void;
}

/** CrossFare's token picker, in CoinDrop's colours: search, chain chips, one row per coin. */
export function CoinPicker({ title, coins, selected, chainIcons, onPick, onClose }: CoinPickerProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const [chain, setChain] = useState<string | null>(null);

  useEffect(() => {
    const el = dialog.current;
    if (el && !el.open) el.showModal();
  }, []);

  const chains: { key: string; name: string }[] = [];
  for (const c of coins) {
    if (!chains.some((x) => x.key === chainKey(c))) chains.push({ key: chainKey(c), name: c.chainName });
  }

  const q = query.trim().toLowerCase();
  const shown = rankCoins(
    coins.filter((c) => chain === null || chainKey(c) === chain),
    q,
  );

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-label={title}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      // A click on the dialog element itself is a click on the backdrop.
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.body}>
        <div className={styles.head}>
          <h2>{title}</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            <Icon name="x" size={16} />
          </button>
        </div>

        <input
          className={styles.search}
          autoFocus
          autoComplete="off"
          spellCheck={false}
          aria-label="Search by coin or chain"
          placeholder="Search by coin or chain"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {chains.length > 1 && (
          <div className={styles.chips} role="group" aria-label="Filter by chain">
            <button type="button" className={styles.chip} aria-pressed={chain === null} onClick={() => setChain(null)}>
              All chains
            </button>
            {chains.map((c) => {
              const icon = chainIcons.get(c.key);
              return (
                <button
                  key={c.key}
                  type="button"
                  className={styles.chip}
                  aria-pressed={chain === c.key}
                  onClick={() => setChain(c.key)}
                >
                  {icon && <CoinChip symbol={icon} size={16} />}
                  {c.name}
                </button>
              );
            })}
          </div>
        )}

        {shown.length === 0 ? (
          <p className={styles.empty} role="status">
            {q ? `No coin matches "${query.trim()}".` : "No coins on this chain."}
          </p>
        ) : (
          <ul className={styles.list}>
            {shown.map((c) => (
              <li key={c.symbol}>
                <button
                  type="button"
                  className={styles.option}
                  aria-current={c.symbol === selected || undefined}
                  onClick={() => {
                    onPick(c.symbol);
                    onClose();
                  }}
                >
                  <CoinMark coin={c} size={36} chainIcon={chainIcons.get(chainKey(c))} />
                  <span className={styles.optionText}>
                    <strong>{c.symbol}</strong>
                    <small>{c.isToken ? `Token on ${c.chainName}` : c.chainName}</small>
                  </span>
                  {c.balance && (
                    <span className={`${styles.balance} mono`}>{formatUnits(c.balance, c.decimals)}</span>
                  )}
                  {c.symbol === selected && <Icon name="check" size={16} className={styles.check} />}
                </button>
              </li>
            ))}
          </ul>
        )}

        <p className={styles.count}>
          {shown.length === coins.length
            ? `${coins.length} ${coins.length === 1 ? "coin" : "coins"}`
            : `${shown.length} of ${coins.length} coins`}
        </p>
      </div>
    </dialog>
  );
}

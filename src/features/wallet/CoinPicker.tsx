import { useEffect, useRef, useState } from "react";
import { CoinChip } from "../../components/CoinChip";
import { Icon } from "../../components/Icon";
import { formatUnits } from "../../lib/format";
import styles from "../../pages/Swap.module.css";

export interface PickerCoin {
  symbol: string;
  chainName: string;
  decimals: number;
  /** smallest units; omitted when the user holds none */
  balance?: string;
}

interface CoinPickerProps {
  title: string;
  coins: PickerCoin[];
  selected?: string;
  onPick: (symbol: string) => void;
  onClose: () => void;
}

/** A searchable coin list in a sheet, like CrossFare's token picker. */
export function CoinPicker({ title, coins, selected, onPick, onClose }: CoinPickerProps) {
  const [query, setQuery] = useState("");
  const search = useRef<HTMLInputElement>(null);

  useEffect(() => {
    search.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const q = query.trim().toLowerCase();
  const shown = q
    ? coins.filter((c) => c.symbol.toLowerCase().includes(q) || c.chainName.toLowerCase().includes(q))
    : coins;

  return (
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.sheet} role="dialog" aria-modal="true" aria-label={title}>
        <div className={styles.sheetHead}>
          <h2 className={styles.sheetTitle}>{title}</h2>
          <button type="button" className={styles.iconButton} onClick={onClose} aria-label="Close">
            <Icon name="x" size={16} />
          </button>
        </div>
        <label className={styles.search}>
          <Icon name="search" size={15} />
          <input
            ref={search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or chain"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <ul className={styles.coinList}>
          {shown.map((c) => (
            <li key={c.symbol}>
              <button
                type="button"
                className={styles.coinOption}
                aria-current={c.symbol === selected || undefined}
                onClick={() => {
                  onPick(c.symbol);
                  onClose();
                }}
              >
                <CoinChip symbol={c.symbol} size={34} />
                <span className={styles.coinOptionText}>
                  <strong>{c.symbol}</strong>
                  <small>{c.chainName}</small>
                </span>
                {c.balance && <span className={`${styles.coinOptionBalance} mono`}>{formatUnits(c.balance, c.decimals)}</span>}
              </button>
            </li>
          ))}
          {shown.length === 0 && <li className={styles.coinEmpty}>No coin matches "{query}".</li>}
        </ul>
      </div>
    </div>
  );
}

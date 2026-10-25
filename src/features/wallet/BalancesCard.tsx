import { useState } from "react";
import { CoinChip } from "../../components/CoinChip";
import { StateBlock } from "../../components/StateBlock";
import { Icon } from "../../components/Icon";
import { formatUnits } from "../../lib/format";
import { toApiError } from "../../api/http";
import { useCurrency } from "../currency/CurrencyContext";
import type { Balance } from "../../api/types";
import { useBalances } from "./useBalances";
import styles from "./cards.module.css";

function sortByValue(a: Balance, b: Balance) {
  return Number(b.usdValue ?? 0) - Number(a.usdValue ?? 0);
}

// the coins someone un-ticked, not the ones they ticked — so a coin they
// receive later shows up without having to go and select it
const HIDDEN_KEY = "coindrop.balances.hidden.v1";
const SEARCH_THRESHOLD = 8;

function readHidden(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(HIDDEN_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

function useHiddenCoins() {
  const [hidden, setHidden] = useState<string[]>(readHidden);

  function save(next: string[]) {
    setHidden(next);
    try {
      localStorage.setItem(HIDDEN_KEY, JSON.stringify(next));
    } catch {
      /* storage blocked — the choice just won't survive a reload */
    }
  }

  return { hidden: new Set(hidden), save };
}

export function BalancesCard() {
  const { data, isPending, isError, error, refetch, isFetching } = useBalances();
  const { money } = useCurrency();
  const { hidden, save } = useHiddenCoins();
  const [picking, setPicking] = useState(false);
  const [search, setSearch] = useState("");

  const balances = (data?.balances ?? [])
    .filter((b) => /[1-9]/.test(b.amount))
    .slice()
    .sort(sortByValue);
  const shown = balances.filter((b) => !hidden.has(b.symbol));
  const hiddenCount = balances.length - shown.length;

  const query = search.trim().toLowerCase();
  const pickable = query
    ? balances.filter(
        (b) => b.symbol.toLowerCase().includes(query) || b.name.toLowerCase().includes(query),
      )
    : balances;

  function toggle(symbol: string) {
    const next = new Set(hidden);
    if (next.has(symbol)) next.delete(symbol);
    else next.add(symbol);
    save([...next]);
  }

  // only touches the coins you hold, so hiding "all" doesn't also pre-hide
  // coins you might receive later
  function setAll(visible: boolean) {
    const held = new Set(balances.map((b) => b.symbol));
    const others = [...hidden].filter((s) => !held.has(s));
    save(visible ? others : [...others, ...held]);
  }

  return (
    <section className={styles.card} data-coachmark="balances">
      <header className={styles.head}>
        <div>
          <p className="eyebrow">Total balance</p>
          {isPending ? (
            <span className="skeleton" style={{ display: "block", width: 180, height: 38, marginTop: 6 }} />
          ) : (
            <p className={styles.total}>{money(data?.totalUsd ?? "0")}</p>
          )}
        </div>
        <div className={styles.headActions}>
          {balances.length > 1 && (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => {
                setPicking((v) => !v);
                setSearch("");
              }}
              aria-expanded={picking}
              aria-controls="balances-picker"
            >
              {picking ? "Done" : "Choose coins"}
              {!picking && <Icon name="chevronDown" size={14} />}
            </button>
          )}
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => void refetch()}
            disabled={isFetching}
            aria-label="Refresh balances"
          >
            <Icon name="refresh" size={15} className={isFetching ? styles.spinning : undefined} />
          </button>
        </div>
      </header>

      {picking && (
        <div id="balances-picker" className={styles.picker}>
          <div className={styles.pickerHead}>
            <p className={styles.rowMeta}>
              Showing {shown.length} of {balances.length} coins
            </p>
            <div className={styles.pickerBulk}>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setAll(true)}>
                Show all
              </button>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setAll(false)}>
                Hide all
              </button>
            </div>
          </div>
          {balances.length > SEARCH_THRESHOLD && (
            <input
              type="search"
              className={styles.pickerSearch}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search coins"
              aria-label="Search coins"
            />
          )}
          <ul className={styles.pickerList}>
            {pickable.map((b) => (
              <li key={b.currencyId}>
                <label className={styles.pickerItem}>
                  <input
                    type="checkbox"
                    checked={!hidden.has(b.symbol)}
                    onChange={() => toggle(b.symbol)}
                  />
                  <CoinChip symbol={b.symbol} size={24} />
                  <span className={styles.rowMain}>
                    <span className={styles.rowTitle}>{b.symbol}</span>
                  </span>
                  <span className={`${styles.rowMeta} mono`}>{money(b.usdValue)}</span>
                </label>
              </li>
            ))}
            {pickable.length === 0 && (
              <li className={styles.rowMeta} style={{ padding: "0.5rem" }}>
                No coins match "{search.trim()}".
              </li>
            )}
          </ul>
        </div>
      )}

      <div className={styles.body}>
        {isPending ? (
          <SkeletonRows />
        ) : isError ? (
          <StateBlock tone="error" title="Couldn't load balances" onRetry={() => void refetch()}>
            {toApiError(error).message}
          </StateBlock>
        ) : balances.length === 0 ? (
          <StateBlock title="No balances yet">
            Get tipped on Discord, Telegram, or Kick and your coins show up here.
          </StateBlock>
        ) : shown.length === 0 ? (
          <StateBlock title="No coins selected">
            <button type="button" className="btn btn--outline btn--sm" onClick={() => setAll(true)}>
              Show all coins
            </button>
          </StateBlock>
        ) : (
          <ul className={styles.rows}>
            {shown.map((b) => (
              <li key={b.currencyId} className={styles.row}>
                <CoinChip symbol={b.symbol} />
                <span className={styles.rowMain}>
                  <span className={styles.rowTitle}>{b.name}</span>
                  <span className={styles.rowMeta}>{b.symbol}</span>
                </span>
                <span className={styles.rowAmount}>
                  <span className="mono">
                    {formatUnits(b.amount, b.decimals)} {b.symbol}
                  </span>
                  <span className={`${styles.rowMeta} mono`}>{money(b.usdValue)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
        {!isPending && !isError && hiddenCount > 0 && shown.length > 0 && (
          <p className={styles.hiddenNote}>
            {hiddenCount} {hiddenCount === 1 ? "coin" : "coins"} hidden ·{" "}
            <button type="button" className={styles.linkButton} onClick={() => setPicking(true)}>
              change
            </button>
          </p>
        )}
      </div>
    </section>
  );
}

function SkeletonRows() {
  return (
    <ul className={styles.rows}>
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className={styles.row}>
          <span className="skeleton" style={{ width: 36, height: 36, borderRadius: "50%" }} />
          <span className={styles.rowMain}>
            <span className="skeleton" style={{ width: 96, height: 13 }} />
            <span className="skeleton" style={{ width: 40, height: 11, marginTop: 6 }} />
          </span>
          <span className={styles.rowAmount}>
            <span className="skeleton" style={{ width: 110, height: 13 }} />
            <span className="skeleton" style={{ width: 64, height: 11, marginTop: 6 }} />
          </span>
        </li>
      ))}
    </ul>
  );
}

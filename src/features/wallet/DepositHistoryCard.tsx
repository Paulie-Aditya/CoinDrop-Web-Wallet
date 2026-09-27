import { useState } from "react";
import { StateBlock } from "../../components/StateBlock";
import { Icon } from "../../components/Icon";
import { Button } from "../../components/Button";
import { absoluteTime, formatUnits, formatUsd, relativeTime } from "../../lib/format";
import { toApiError } from "../../api/http";
import { useBalances, useDecimalsBySymbol } from "./useBalances";
import { useDepositHistory } from "./useHistory";
import styles from "./cards.module.css";

export function DepositHistoryCard() {
  const [currency, setCurrency] = useState<string | null>(null);

  const balances = useBalances();
  const currencyOptions = [...new Set((balances.data?.balances ?? []).map((b) => b.symbol))].sort();
  const decimalsBySymbol = useDecimalsBySymbol();

  const query = useDepositHistory(currency);
  const rows = query.data?.pages.flatMap((p) => p.deposits) ?? [];

  return (
    <section className={styles.card}>
      <header className={styles.head}>
        <div>
          <p className="eyebrow">Deposit history</p>
          <p className={styles.rowMeta} style={{ marginTop: "0.3rem", maxWidth: "26rem" }}>
            Only shows deposits since notifications went live — earlier ones won't
            appear here.
          </p>
        </div>
        {currencyOptions.length > 0 && (
          <div className={styles.filters}>
            <div className={styles.selectWrap}>
              <select
                className={styles.select}
                value={currency ?? ""}
                onChange={(e) => setCurrency(e.target.value || null)}
                aria-label="Filter by coin"
              >
                <option value="">All coins</option>
                {currencyOptions.map((sym) => (
                  <option key={sym} value={sym}>
                    {sym}
                  </option>
                ))}
              </select>
              <Icon name="chevronDown" size={14} className={styles.selectChevron} />
            </div>
          </div>
        )}
      </header>

      <div className={styles.body}>
        {query.isPending ? (
          <SkeletonRows />
        ) : query.isError ? (
          <StateBlock
            tone="error"
            title="Couldn't load deposit history"
            onRetry={() => void query.refetch()}
          >
            {toApiError(query.error).message}
          </StateBlock>
        ) : rows.length === 0 ? (
          <StateBlock title="No deposits yet">
            Send crypto to one of your CoinDrop addresses and it'll show up here.
          </StateBlock>
        ) : (
          <>
            <ul className={styles.rows}>
              {rows.map((d) => {
                const decimals = decimalsBySymbol.get(d.symbol);
                return (
                  <li key={d.id} className={styles.row}>
                    <span className={styles.dirIcon} data-dir="in" aria-hidden="true">
                      <Icon name="arrowDownLeft" size={16} />
                    </span>
                    <span className={styles.rowMain}>
                      <span className={styles.rowTitle}>
                        Deposit{d.chainName ? ` — ${d.chainName}` : ""}
                      </span>
                      <time
                        className={styles.rowMeta}
                        dateTime={d.createdAt}
                        title={absoluteTime(d.createdAt)}
                      >
                        {relativeTime(d.createdAt)}
                      </time>
                    </span>
                    <span className={styles.rowAmount}>
                      <span className="mono" style={{ color: "var(--pos)" }}>
                        +{decimals !== undefined ? formatUnits(d.amount, decimals) : d.amount}{" "}
                        {d.symbol}
                      </span>
                      <span className={`${styles.rowMeta} mono`}>{formatUsd(d.usdValue)}</span>
                    </span>
                  </li>
                );
              })}
            </ul>

            {query.hasNextPage ? (
              <div className={styles.more}>
                <Button
                  size="sm"
                  onClick={() => void query.fetchNextPage()}
                  disabled={query.isFetchingNextPage}
                >
                  {query.isFetchingNextPage ? "Loading…" : "Load more"}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}

function SkeletonRows() {
  return (
    <ul className={styles.rows}>
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className={styles.row}>
          <span className="skeleton" style={{ width: 32, height: 32, borderRadius: "50%" }} />
          <span className={styles.rowMain}>
            <span className="skeleton" style={{ width: 140, height: 13 }} />
            <span className="skeleton" style={{ width: 70, height: 11, marginTop: 6 }} />
          </span>
          <span className={styles.rowAmount}>
            <span className="skeleton" style={{ width: 104, height: 13 }} />
            <span className="skeleton" style={{ width: 56, height: 11, marginTop: 6 }} />
          </span>
        </li>
      ))}
    </ul>
  );
}

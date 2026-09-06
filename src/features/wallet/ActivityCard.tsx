import { useState } from "react";
import { StateBlock } from "../../components/StateBlock";
import { Icon } from "../../components/Icon";
import { Button } from "../../components/Button";
import { absoluteTime, formatUnits, formatUsd, relativeTime } from "../../lib/format";
import { toApiError } from "../../api/http";
import type { Transaction, TxFilter, TxKind } from "../../api/types";
import { useBalances } from "./useBalances";
import { useTransactions } from "./useTransactions";
import styles from "./cards.module.css";

const FILTERS: { id: TxFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "received", label: "Received" },
  { id: "sent", label: "Sent" },
];

const KIND_LABEL: Record<TxKind, string> = {
  tip: "Tip",
  airdrop: "Airdrop",
  raffle: "Raffle",
  quickdrop: "QuickDrop",
  slowdrop: "SlowDrop",
  mathtip: "MathTip",
  triviadrop: "TriviaDrop",
  swap: "Swap",
  deposit: "Deposit",
  withdrawal: "Withdrawal",
};

function describe(tx: Transaction): string {
  const kind = KIND_LABEL[tx.kind];
  if (!tx.counterparty) return kind;
  return `${kind} ${tx.direction === "in" ? "from" : "to"} ${tx.counterparty}`;
}

const EMPTY_COPY: Record<TxFilter, string> = {
  all: "Once you send or receive a tip, it'll show up here.",
  received: "No incoming tips, drops or deposits yet.",
  sent: "You haven't sent anything yet.",
};

export function ActivityCard() {
  const [filter, setFilter] = useState<TxFilter>("all");
  const [currency, setCurrency] = useState<string | null>(null);

  const balances = useBalances();
  const currencyOptions = (balances.data?.balances ?? [])
    .filter((b) => /[1-9]/.test(b.amount))
    .map((b) => b.symbol);

  const query = useTransactions(filter, currency);
  const rows = query.data?.pages.flatMap((p) => p.transactions) ?? [];

  return (
    <section className={styles.card}>
      <header className={styles.head}>
        <p className="eyebrow">Activity</p>
        <div className={styles.filters}>
          <div className={styles.segmented} role="tablist" aria-label="Filter activity">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                role="tab"
                aria-selected={filter === f.id}
                className={styles.segment}
                data-active={filter === f.id}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
          {currencyOptions.length > 0 ? (
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
          ) : null}
        </div>
      </header>

      <div className={styles.body}>
        {query.isPending ? (
          <SkeletonRows />
        ) : query.isError ? (
          <StateBlock
            tone="error"
            title="Couldn't load activity"
            onRetry={() => void query.refetch()}
          >
            {toApiError(query.error).message}
          </StateBlock>
        ) : rows.length === 0 ? (
          <StateBlock title="Nothing here yet">{EMPTY_COPY[filter]}</StateBlock>
        ) : (
          <>
            <ul className={styles.rows}>
              {rows.map((tx) => {
                const incoming = tx.direction === "in";
                return (
                  <li key={tx.id} className={styles.row}>
                    <span
                      className={styles.dirIcon}
                      data-dir={tx.direction}
                      aria-hidden="true"
                    >
                      <Icon name={incoming ? "arrowDownLeft" : "arrowUpRight"} size={16} />
                    </span>
                    <span className={styles.rowMain}>
                      <span className={styles.rowTitle}>{describe(tx)}</span>
                      <time className={styles.rowMeta} dateTime={tx.timestamp} title={absoluteTime(tx.timestamp)}>
                        {relativeTime(tx.timestamp)}
                      </time>
                    </span>
                    <span className={styles.rowAmount}>
                      <span className="mono" data-dir={tx.direction} style={{ color: incoming ? "var(--pos)" : "var(--neg)" }}>
                        {incoming ? "+" : "−"}
                        {formatUnits(tx.amount, tx.decimals)} {tx.symbol}
                      </span>
                      <span className={`${styles.rowMeta} mono`}>{formatUsd(tx.usdValue)}</span>
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
      {Array.from({ length: 6 }).map((_, i) => (
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

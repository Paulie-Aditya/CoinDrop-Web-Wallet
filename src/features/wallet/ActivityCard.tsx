import { useState } from "react";
import { StateBlock } from "../../components/StateBlock";
import { Icon } from "../../components/Icon";
import { Button } from "../../components/Button";
import { absoluteTime, formatUnits, relativeTime } from "../../lib/format";
import { downloadCsv } from "../../lib/exportCsv";
import { toApiError } from "../../api/http";
import { useCurrency } from "../currency/CurrencyContext";
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
  const kind = KIND_LABEL[tx.kind] ?? (tx.direction === "in" ? "Received" : "Sent");
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
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const { money } = useCurrency();

  const balances = useBalances();
  const currencyOptions = (balances.data?.balances ?? [])
    .filter((b) => /[1-9]/.test(b.amount))
    .map((b) => b.symbol);

  const query = useTransactions(filter, currency);
  const allRows = query.data?.pages.flatMap((p) => p.transactions) ?? [];

  const hasDateFilter = !!dateFrom || !!dateTo;
  const fromMs = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
  const toMs = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null;

  // /wallet/transactions has no date filter server-side, so this only
  // narrows whatever's already been paginated in — "Load more" below doubles
  // as "search further back in time" when a date range is active and the
  // list looks empty.
  const rows = hasDateFilter
    ? allRows.filter((tx) => {
        const t = new Date(tx.timestamp).getTime();
        if (fromMs !== null && t < fromMs) return false;
        if (toMs !== null && t > toMs) return false;
        return true;
      })
    : allRows;

  function exportCsv() {
    downloadCsv(
      `coindrop-activity-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Date", "Type", "Counterparty", "Symbol", "Amount", "USD value", "Direction"],
      rows.map((tx) => [
        tx.timestamp,
        KIND_LABEL[tx.kind] ?? tx.kind,
        tx.counterparty ?? "",
        tx.symbol,
        formatUnits(tx.amount, tx.decimals),
        tx.usdValue ?? "",
        tx.direction,
      ]),
    );
  }

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
          <div className={styles.dateRange}>
            <input
              type="date"
              className={styles.dateInput}
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => setDateFrom(e.target.value)}
              aria-label="From date"
            />
            <span className={styles.rowMeta}>to</span>
            <input
              type="date"
              className={styles.dateInput}
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => setDateTo(e.target.value)}
              aria-label="To date"
            />
            {hasDateFilter && (
              <button
                type="button"
                className={styles.dateClear}
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                }}
                aria-label="Clear date filter"
              >
                <Icon name="x" size={14} />
              </button>
            )}
          </div>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={exportCsv}
            disabled={rows.length === 0}
          >
            <Icon name="download" size={14} />
            Export CSV
          </button>
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
          <>
            <StateBlock title={hasDateFilter ? "No matches in this range" : "Nothing here yet"}>
              {hasDateFilter
                ? query.hasNextPage
                  ? "None of what's loaded so far falls in this range — load more to search further back."
                  : "No transactions fall in this date range."
                : EMPTY_COPY[filter]}
            </StateBlock>
            {hasDateFilter && query.hasNextPage && (
              <div className={styles.more}>
                <Button
                  size="sm"
                  onClick={() => void query.fetchNextPage()}
                  disabled={query.isFetchingNextPage}
                >
                  {query.isFetchingNextPage ? "Loading…" : "Load more"}
                </Button>
              </div>
            )}
          </>
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
                      <span className={`${styles.rowMeta} mono`}>{money(tx.usdValue)}</span>
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

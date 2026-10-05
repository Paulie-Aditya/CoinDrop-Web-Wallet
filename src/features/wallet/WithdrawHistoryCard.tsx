import { useState } from "react";
import { StateBlock } from "../../components/StateBlock";
import { Icon } from "../../components/Icon";
import { Button } from "../../components/Button";
import { absoluteTime, formatUnits, relativeTime } from "../../lib/format";
import { toApiError } from "../../api/http";
import { useCurrency } from "../currency/CurrencyContext";
import type { WithdrawStatusValue } from "../../api/types";
import { useBalances } from "./useBalances";
import { useWithdrawHistory } from "./useHistory";
import styles from "./cards.module.css";

const STATUS_LABEL: Record<WithdrawStatusValue, string> = {
  queued: "Queued",
  processing: "Processing",
  done: "Done",
  failed: "Failed",
};

const STATUS_COLOR: Record<WithdrawStatusValue, string> = {
  queued: "var(--ink-300)",
  processing: "var(--gold)",
  done: "var(--pos)",
  failed: "var(--neg)",
};

export function WithdrawHistoryCard() {
  const [currency, setCurrency] = useState<string | null>(null);
  const { money } = useCurrency();

  const balances = useBalances();
  const currencyOptions = [...new Set((balances.data?.balances ?? []).map((b) => b.symbol))].sort();

  const query = useWithdrawHistory(currency);
  const rows = query.data?.pages.flatMap((p) => p.withdrawals) ?? [];

  return (
    <section className={styles.card}>
      <header className={styles.head}>
        <p className="eyebrow">Withdrawal history</p>
        <div className={styles.filters}>
          {currencyOptions.length > 0 && (
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
          )}
        </div>
      </header>

      <div className={styles.body}>
        {query.isPending ? (
          <SkeletonRows />
        ) : query.isError ? (
          <StateBlock
            tone="error"
            title="Couldn't load withdrawal history"
            onRetry={() => void query.refetch()}
          >
            {toApiError(query.error).message}
          </StateBlock>
        ) : rows.length === 0 ? (
          <StateBlock title="No withdrawals yet">
            Withdrawals you make show up here, from any platform.
          </StateBlock>
        ) : (
          <>
            <ul className={styles.rows}>
              {rows.map((w) => (
                <li key={w.id} className={styles.row}>
                  <span className={styles.dirIcon} data-dir="out" aria-hidden="true">
                    <Icon name="arrowUpRight" size={16} />
                  </span>
                  <span className={styles.rowMain}>
                    <span className={styles.rowTitle}>
                      Withdrawal
                      {w.explorerUrl && (
                        <a
                          href={w.explorerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.rowLink}
                          aria-label="View on explorer"
                        >
                          <Icon name="external" size={13} />
                        </a>
                      )}
                    </span>
                    <span className={styles.rowMeta}>
                      <span style={{ color: STATUS_COLOR[w.status] }}>
                        {STATUS_LABEL[w.status]}
                      </span>
                      {w.createdAt && (
                        <>
                          {" · "}
                          <time dateTime={w.createdAt} title={absoluteTime(w.createdAt)}>
                            {relativeTime(w.createdAt)}
                          </time>
                        </>
                      )}
                    </span>
                  </span>
                  <span className={styles.rowAmount}>
                    <span className="mono" style={{ color: "var(--neg)" }}>
                      −{formatUnits(w.sendAmount, w.decimals)} {w.currency}
                    </span>
                    <span className={`${styles.rowMeta} mono`}>
                      {money(w.sendAmountUsd)}
                    </span>
                  </span>
                </li>
              ))}
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

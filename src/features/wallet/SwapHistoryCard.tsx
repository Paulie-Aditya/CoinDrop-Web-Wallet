import { StateBlock } from "../../components/StateBlock";
import { Icon } from "../../components/Icon";
import { Button } from "../../components/Button";
import { absoluteTime, formatUnits, relativeTime } from "../../lib/format";
import { toApiError } from "../../api/http";
import type { Swap, SwapStatusValue } from "../../api/types";
import { useSwapStatus, useSwaps } from "./useSwap";
import { PROGRESS_COPY, STATUS_LABEL, routeLabel } from "./swapLabels";
import styles from "./cards.module.css";

const STATUS_COLOR: Record<SwapStatusValue, string> = {
  pending: "var(--gold)",
  completed: "var(--pos)",
  refunded: "var(--ink-300)",
  needs_review: "var(--neg)",
  hub_credited: "var(--gold)",
};

function SwapRow({ swap: initial }: { swap: Swap }) {
  // Pending rows poll their own status, which is also what settles them.
  const live = useSwapStatus(initial.status === "pending" ? initial.id : null);
  const swap = live.data ?? initial;
  const done = swap.status === "completed";
  const received = done ? swap.amountOut ?? swap.expectedOut : swap.expectedOut;
  // Stopped halfway: what the user got is the coin in between.
  const gotHub = swap.status === "hub_credited" && !!swap.hubCredited && swap.hubDecimals != null;
  const status =
    swap.status === "pending" && swap.progress ? PROGRESS_COPY[swap.progress] : STATUS_LABEL[swap.status];

  return (
    <li className={styles.row}>
      <span className={styles.dirIcon} aria-hidden="true">
        <Icon name="swap" size={16} />
      </span>
      <span className={styles.rowMain}>
        <span className={styles.rowTitle}>
          {swap.fromSymbol} → {swap.toSymbol}
        </span>
        <span className={styles.rowMeta}>
          <span style={{ color: STATUS_COLOR[swap.status] }}>{status}</span>
          {" · "}
          <time dateTime={swap.createdAt} title={absoluteTime(swap.createdAt)}>
            {relativeTime(swap.createdAt)}
          </time>
          {" · "}
          {routeLabel(swap.route?.steps)}
        </span>
      </span>
      <span className={styles.rowAmount}>
        <span className="mono" style={{ color: done || gotHub ? "var(--pos)" : undefined }}>
          {gotHub
            ? `+${formatUnits(swap.hubCredited!, swap.hubDecimals!)} ${swap.hubSymbol}`
            : `${done ? "+" : "≈ "}${formatUnits(received, swap.toDecimals)} ${swap.toSymbol}`}
        </span>
        <span className={`${styles.rowMeta} mono`}>
          −{formatUnits(swap.amountIn, swap.fromDecimals)} {swap.fromSymbol}
        </span>
      </span>
    </li>
  );
}

export function SwapHistoryCard() {
  const query = useSwaps();
  const rows = query.data?.pages.flatMap((p) => p.swaps) ?? [];

  return (
    <section className={styles.card}>
      <header className={styles.head}>
        <p className="eyebrow">Recent swaps</p>
      </header>
      <div className={styles.body}>
        {query.isPending ? null : query.isError ? (
          <StateBlock tone="error" title="Couldn't load your swaps" onRetry={() => void query.refetch()}>
            {toApiError(query.error).message}
          </StateBlock>
        ) : rows.length === 0 ? (
          <StateBlock title="No swaps yet">Swaps you make show up here.</StateBlock>
        ) : (
          <>
            <ul className={styles.rows}>
              {rows.map((s) => (
                <SwapRow key={s.id} swap={s} />
              ))}
            </ul>
            {query.hasNextPage && (
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
        )}
      </div>
    </section>
  );
}

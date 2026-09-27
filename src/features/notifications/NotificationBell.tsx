import { useEffect, useRef, useState } from "react";
import { Icon } from "../../components/Icon";
import { CoinLoader } from "../../components/CoinLoader";
import { StateBlock } from "../../components/StateBlock";
import { toApiError } from "../../api/http";
import { absoluteTime, formatUnits, formatUsd, relativeTime } from "../../lib/format";
import { useMarkNotificationSeen, useNotifications } from "./useNotifications";
import styles from "./NotificationBell.module.css";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const query = useNotifications();
  const markSeen = useMarkNotificationSeen();

  const unseenCount = query.data?.pages[0]?.unseenCount ?? 0;
  const rows = query.data?.pages.flatMap((p) => p.notifications) ?? [];

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className="btn btn--ghost btn--sm"
        onClick={() => setOpen((v) => !v)}
        aria-label={unseenCount > 0 ? `${unseenCount} unread notifications` : "Notifications"}
        aria-expanded={open}
      >
        <span className={styles.bellWrap}>
          <Icon name="bell" size={17} />
          {unseenCount > 0 && (
            <span className={styles.badge}>{unseenCount > 9 ? "9+" : unseenCount}</span>
          )}
        </span>
      </button>

      {open && (
        <div className={styles.panel} role="menu">
          <div className={styles.panelHead}>
            <p className="eyebrow">Notifications</p>
          </div>

          <div className={styles.panelBody}>
            {query.isPending ? (
              <CoinLoader label="Loading" size={30} />
            ) : query.isError ? (
              <StateBlock
                tone="error"
                title="Couldn't load notifications"
                onRetry={() => void query.refetch()}
              >
                {toApiError(query.error).message}
              </StateBlock>
            ) : rows.length === 0 ? (
              <StateBlock title="Nothing yet">
                Deposits will show up here as they land.
              </StateBlock>
            ) : (
              <>
                <ul className={styles.rows}>
                  {rows.map((n) => (
                    <li key={n.id} className={styles.row}>
                      <button
                        type="button"
                        className={styles.rowButton}
                        data-seen={n.seen}
                        onClick={() => !n.seen && markSeen.mutate(n.id)}
                      >
                        <span className={styles.dot} aria-hidden="true" />
                        <span className={styles.rowMain}>
                          <span className={styles.rowTitle}>
                            Deposit received — {formatUnits(n.amount, n.decimals)} {n.symbol}
                          </span>
                          <span className={styles.rowMeta}>
                            {formatUsd(n.usdValue)} ·{" "}
                            <time dateTime={n.timestamp} title={absoluteTime(n.timestamp)}>
                              {relativeTime(n.timestamp)}
                            </time>
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>

                {query.hasNextPage && (
                  <div className={styles.more}>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => void query.fetchNextPage()}
                      disabled={query.isFetchingNextPage}
                    >
                      {query.isFetchingNextPage ? "Loading…" : "Load more"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

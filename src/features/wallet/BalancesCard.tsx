import { CoinChip } from "../../components/CoinChip";
import { StateBlock } from "../../components/StateBlock";
import { Icon } from "../../components/Icon";
import { formatUnits, formatUsd } from "../../lib/format";
import { toApiError } from "../../api/http";
import type { Balance } from "../../api/types";
import { useBalances } from "./useBalances";
import styles from "./cards.module.css";

function sortByValue(a: Balance, b: Balance) {
  return Number(b.usdValue ?? 0) - Number(a.usdValue ?? 0);
}

export function BalancesCard() {
  const { data, isPending, isError, error, refetch, isFetching } = useBalances();

  const balances = (data?.balances ?? [])
    .filter((b) => /[1-9]/.test(b.amount))
    .slice()
    .sort(sortByValue);

  return (
    <section className={styles.card}>
      <header className={styles.head}>
        <div>
          <p className="eyebrow">Total balance</p>
          {isPending ? (
            <span className="skeleton" style={{ display: "block", width: 180, height: 38, marginTop: 6 }} />
          ) : (
            <p className={styles.total}>{formatUsd(data?.totalUsd ?? "0")}</p>
          )}
        </div>
        <button
          className="btn btn--ghost btn--sm"
          onClick={() => void refetch()}
          disabled={isFetching}
          aria-label="Refresh balances"
        >
          <Icon name="refresh" size={15} />
        </button>
      </header>

      <div className={styles.body}>
        {isPending ? (
          <SkeletonRows />
        ) : isError ? (
          <StateBlock tone="error" title="Couldn't load balances" onRetry={() => void refetch()}>
            {toApiError(error).message}
          </StateBlock>
        ) : balances.length === 0 ? (
          <StateBlock title="No balances yet">
            Get tipped on Discord or Telegram and your coins show up here.
          </StateBlock>
        ) : (
          <ul className={styles.rows}>
            {balances.map((b) => (
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
                  <span className={`${styles.rowMeta} mono`}>{formatUsd(b.usdValue)}</span>
                </span>
              </li>
            ))}
          </ul>
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

import { useEffect } from "react";
import { CoinLoader } from "../../components/CoinLoader";
import { StateBlock } from "../../components/StateBlock";
import { SuccessCheck } from "../../components/SuccessCheck";
import { toApiError } from "../../api/http";
import { formatUnits } from "../../lib/format";
import { refreshAfterSwap, useSwapStatus } from "./useSwap";
import { PROGRESS_COPY, routeLabel } from "./swapLabels";
import styles from "../../pages/WalletActions.module.css";

export function SwapStatusPanel({ id }: { id: number }) {
  const { data, isPending, isError, error, refetch } = useSwapStatus(id);

  useEffect(() => {
    if (data && data.status !== "pending") refreshAfterSwap();
  }, [data?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isPending) return <CoinLoader label="Checking your swap" />;
  if (isError) {
    return (
      <StateBlock tone="error" title="Couldn't check your swap" onRetry={() => void refetch()}>
        {toApiError(error).message}
      </StateBlock>
    );
  }

  const paid = `${formatUnits(data.amountIn, data.fromDecimals)} ${data.fromSymbol}`;

  if (data.status === "completed") {
    return (
      <div>
        <div className={styles.doneWrap} style={{ paddingTop: 0 }}>
          <SuccessCheck />
          <p className="eyebrow" style={{ marginTop: "0.6rem" }}>Swap complete</p>
        </div>
        <div className={styles.breakdown} style={{ marginTop: "0.9rem" }}>
          <div className={styles.breakdownRow}>
            <span className={styles.breakdownLabel}>You paid</span>
            <span className={`${styles.breakdownAmount} mono`}>{paid}</span>
          </div>
          <div className={styles.breakdownRow} data-emphasis="true">
            <span className={styles.breakdownLabel}>You received</span>
            <span className={`${styles.breakdownAmount} mono`}>
              {formatUnits(data.amountOut ?? "0", data.toDecimals)} {data.toSymbol}
            </span>
          </div>
        </div>
        <p className={styles.hint} style={{ marginTop: "0.9rem" }}>
          It's in your balance now.
        </p>
      </div>
    );
  }

  if (data.status === "refunded") {
    return (
      <StateBlock title="Swap didn't go through">
        Your {paid} is back in your balance.
      </StateBlock>
    );
  }

  if (data.status === "needs_review") {
    return (
      <StateBlock tone="error" title="This swap needs a manual check">
        Something unusual happened while swapping {paid}. Support will review it and credit
        your balance — reach out with swap #{data.id} if you have questions.
      </StateBlock>
    );
  }

  return (
    <div>
      <CoinLoader label={data.progress ? PROGRESS_COPY[data.progress] : "Starting your swap"} />
      <div className={styles.breakdown} style={{ marginTop: "0.9rem" }}>
        <div className={styles.breakdownRow}>
          <span className={styles.breakdownLabel}>Swapping</span>
          <span className={`${styles.breakdownAmount} mono`}>{paid}</span>
        </div>
        <div className={styles.breakdownRow} data-emphasis="true">
          <span className={styles.breakdownLabel}>For about</span>
          <span className={`${styles.breakdownAmount} mono`}>
            {formatUnits(data.expectedOut, data.toDecimals)} {data.toSymbol}
          </span>
        </div>
        <div className={styles.breakdownRow}>
          <span className={styles.breakdownLabel}>Route</span>
          <span className={styles.breakdownAmount}>{routeLabel(data.venue, data.provider)}</span>
        </div>
      </div>
      <p className={styles.hint} style={{ marginTop: "0.9rem" }}>
        You can leave this page — the swap keeps going and lands in your balance when it's done.
      </p>
    </div>
  );
}

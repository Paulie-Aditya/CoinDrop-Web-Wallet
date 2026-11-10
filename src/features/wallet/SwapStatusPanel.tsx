import { useEffect } from "react";
import { CoinChip } from "../../components/CoinChip";
import { CoinLoader } from "../../components/CoinLoader";
import { Icon } from "../../components/Icon";
import { StateBlock } from "../../components/StateBlock";
import { SuccessCheck } from "../../components/SuccessCheck";
import { toApiError } from "../../api/http";
import { formatUnits } from "../../lib/format";
import type { Swap } from "../../api/types";
import { refreshAfterSwap, useSwapStatus } from "./useSwap";
import { ROUTE_NAME, routeLabel } from "./swapLabels";
import styles from "../../pages/Swap.module.css";

type StepState = "done" | "active" | "todo";

/** How far along a swap is: 0 sending, 1 swapping (a two-step swap's first step),
 *  2 its second step, then credited. */
function stage(swap: Swap): number {
  const twoSteps = (swap.legCount ?? 1) === 2;
  if (swap.status === "completed") return twoSteps ? 4 : 3;
  if (twoSteps && ((swap.leg ?? 1) >= 2 || swap.progress === "awaiting_next_leg")) return 2;
  if (swap.progress === "exchanging" || swap.progress === "completed") return 1;
  return 0;
}

function stepState(index: number, at: number): StepState {
  return index < at ? "done" : index === at ? "active" : "todo";
}

function Header({ swap }: { swap: Swap }) {
  const done = swap.status === "completed";
  const received = done ? swap.amountOut ?? swap.expectedOut : swap.expectedOut;
  return (
    <div className={styles.statusHead}>
      <span className={styles.statusSide}>
        <CoinChip symbol={swap.fromSymbol} size={34} />
        <span className={styles.statusAmount}>
          <strong>
            {formatUnits(swap.amountIn, swap.fromDecimals)} {swap.fromSymbol}
          </strong>
          <small>You paid</small>
        </span>
      </span>
      <Icon name="arrowRight" size={18} className={styles.statusArrow} />
      <span className={styles.statusSide}>
        <CoinChip symbol={swap.toSymbol} size={34} />
        <span className={styles.statusAmount}>
          <strong>
            {done ? "" : "≈ "}
            {formatUnits(received, swap.toDecimals)} {swap.toSymbol}
          </strong>
          <small>{done ? "You received" : "You'll receive"}</small>
        </span>
      </span>
    </div>
  );
}

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

  if (data.status === "refunded") {
    return (
      <StateBlock title="Swap didn't go through">
        {data.amountRefunded
          ? `${formatUnits(data.amountRefunded, data.fromDecimals)} ${data.fromSymbol} is back in your balance.`
          : `Your ${data.fromSymbol} is back in your balance.`}{" "}
        If the coins had already been sent, the network fee for sending them isn't returned.
      </StateBlock>
    );
  }

  if (data.status === "hub_credited") {
    const hub = data.hubSymbol ?? "the coin in between";
    return (
      <StateBlock title="Swap stopped halfway">
        This swap went in two steps, through {hub}. The first step went through, but the second couldn't, so{" "}
        {data.hubCredited && data.hubDecimals != null
          ? `${formatUnits(data.hubCredited, data.hubDecimals)} ${hub} is`
          : `the ${hub} is`}{" "}
        in your balance instead of {data.toSymbol}. You can swap it again whenever you like.
      </StateBlock>
    );
  }

  if (data.status === "needs_review") {
    return (
      <StateBlock tone="error" title="This swap needs a manual check">
        Something unusual happened while swapping {formatUnits(data.amountIn, data.fromDecimals)}{" "}
        {data.fromSymbol}. Support will review it and credit your balance. Reach out with swap #{data.id} if
        you have questions.
      </StateBlock>
    );
  }

  const venues = data.route?.steps ?? [];
  const twoSteps = (data.legCount ?? 1) === 2 && venues.length === 2;
  const hub = data.hubSymbol ?? "the coin in between";
  const at = stage(data);
  const swapping = twoSteps
    ? [
        { title: `Swapping on ${venues[0]}`, detail: `${data.fromSymbol} into ${hub}` },
        {
          title: `Swapping on ${venues[1]}`,
          detail: `${hub} into ${data.toSymbol}. If this step can't go through, you get the ${hub}`,
        },
      ]
    : [{ title: `Swapping on ${venues[0] ?? ROUTE_NAME}`, detail: `${data.fromSymbol} into ${data.toSymbol}` }];
  const steps: { state: StepState; title: string; detail: string }[] = [
    { title: `Sending your ${data.fromSymbol}`, detail: "From CoinDrop's wallet to the swap" },
    ...swapping,
    { title: "Added to your balance", detail: `Your ${data.toSymbol} lands in your CoinDrop wallet` },
  ].map((step, i) => ({ ...step, state: stepState(i, at) }));

  return (
    <div>
      {data.status === "completed" && (
        <div style={{ display: "grid", placeItems: "center", marginBottom: "1rem" }}>
          <SuccessCheck />
        </div>
      )}
      <Header swap={data} />

      <ol className={styles.steps}>
        {steps.map((step) => (
          <li key={step.title} className={styles.step} data-state={step.state}>
            <span className={styles.dot} aria-hidden="true">
              {step.state === "done" && <Icon name="check" size={11} strokeWidth={3} />}
            </span>
            <span className={styles.stepText}>
              <strong>{step.title}</strong>
              <small>{step.detail}</small>
            </span>
          </li>
        ))}
      </ol>

      <dl className={styles.statusFacts}>
        <div>
          <dt>Network fee</dt>
          <dd className="mono">
            {formatUnits(data.networkFee ?? "0", data.fromDecimals)} {data.fromSymbol}
          </dd>
        </div>
        <div>
          <dt>Minimum received</dt>
          <dd className="mono">
            {formatUnits(data.minOut, data.toDecimals)} {data.toSymbol}
          </dd>
        </div>
        <div>
          <dt>Route</dt>
          <dd>
            {routeLabel(
              data.route?.steps,
              data.hubSymbol ? { symbol: data.hubSymbol, decimals: data.hubDecimals ?? 0, amount: data.amountHub } : null,
            )}
          </dd>
        </div>
      </dl>

      <p className={styles.statusNote}>
        {data.status === "completed"
          ? "It's in your balance now."
          : "You can leave this page. The swap keeps going and lands in your balance when it's done."}
      </p>
    </div>
  );
}

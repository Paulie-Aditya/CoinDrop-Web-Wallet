import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { PageShell } from "../components/PageShell";
import { Icon } from "../components/Icon";
import { Button } from "../components/Button";
import { StateBlock } from "../components/StateBlock";
import { toApiError } from "../api/http";
import { formatUnits, formatUnitsPlain, parseUnits } from "../lib/format";
import { useCountdown } from "../lib/useCountdown";
import { useCurrency } from "../features/currency/CurrencyContext";
import { useBalances } from "../features/wallet/useBalances";
import { useSwapAssets, useSwapConfirm, useSwapQuote } from "../features/wallet/useSwap";
import { SwapStatusPanel } from "../features/wallet/SwapStatusPanel";
import { SwapHistoryCard } from "../features/wallet/SwapHistoryCard";
import { etaLabel, feeLabel, routeLabel } from "../features/wallet/swapLabels";
import type { SwapQuote } from "../api/types";
import styles from "./WalletActions.module.css";

// Venue prices move; a quote older than this gets refreshed rather than
// confirmed (the backend would re-price it anyway).
const QUOTE_FRESH_SECONDS = 60;

export function Swap() {
  const { money } = useCurrency();
  const balances = useBalances();
  const assets = useSwapAssets();

  const swappable = assets.data?.assets ?? [];
  const swappableSymbols = new Set(swappable.map((a) => a.symbol));
  const holdings = (balances.data?.balances ?? []).filter(
    (b) => /[1-9]/.test(b.amount) && swappableSymbols.has(b.symbol),
  );

  const [fromSymbol, setFromSymbol] = useState("");
  const [toSymbol, setToSymbol] = useState("");
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [swapId, setSwapId] = useState<number | null>(null);

  const remaining = useCountdown(expiresAt);
  const expired = quote !== null && remaining <= 0;

  const quoteMutation = useSwapQuote();
  const confirmMutation = useSwapConfirm();

  const activeFrom = fromSymbol || holdings[0]?.symbol || "";
  const selected = holdings.find((b) => b.symbol === activeFrom);
  const targets = swappable.filter((a) => a.symbol !== activeFrom);
  const activeTo = targets.some((a) => a.symbol === toSymbol) ? toSymbol : targets[0]?.symbol ?? "";

  function showQuote(q: SwapQuote, receivedAt: number) {
    setQuote(q);
    setExpiresAt(receivedAt + Math.min(q.expiresInSeconds, QUOTE_FRESH_SECONDS) * 1000);
  }

  function requestQuote() {
    if (!selected || !activeTo) return;
    setNotice(null);
    quoteMutation.reset();
    confirmMutation.reset();
    quoteMutation.mutate(
      { fromSymbol: activeFrom, toSymbol: activeTo, amount: parseUnits(amount.trim(), selected.decimals) },
      { onSuccess: (q) => showQuote(q, Date.now()) },
    );
  }

  function handleReview(e: FormEvent) {
    e.preventDefault();
    requestQuote();
  }

  function handleConfirm() {
    if (!quote) return;
    setNotice(null);
    confirmMutation.mutate(quote.token, {
      onSuccess: ({ swap }) => setSwapId(swap.id),
      onError: (err) => {
        // The price moved since the quote: show the new one and ask again.
        const fresh = axios.isAxiosError(err) ? (err.response?.data as { quote?: SwapQuote })?.quote : undefined;
        if (fresh) {
          showQuote(fresh, Date.now());
          setNotice("The price changed. Review the new quote and confirm again.");
          confirmMutation.reset();
        }
      },
    });
  }

  function startOver() {
    setQuote(null);
    setExpiresAt(null);
    setNotice(null);
    setSwapId(null);
    quoteMutation.reset();
    confirmMutation.reset();
  }

  function flip() {
    if (!activeTo) return;
    const nextFrom = holdings.some((b) => b.symbol === activeTo) ? activeTo : activeFrom;
    setToSymbol(activeFrom);
    setFromSymbol(nextFrom);
    setAmount("");
  }

  const back = (
    <Link to="/wallet" className={styles.back}>
      <Icon name="arrowLeft" size={15} />
      Back to wallet
    </Link>
  );

  if (swapId !== null) {
    return (
      <PageShell>
        {back}
        <section className={`panel ${styles.card}`}>
          <SwapStatusPanel id={swapId} />
          <div className={styles.actions}>
            <Button type="button" variant="outline" onClick={startOver}>
              Make another swap
            </Button>
          </div>
        </section>
        <div style={{ marginTop: "1.5rem" }}>
          <SwapHistoryCard />
        </div>
      </PageShell>
    );
  }

  const feeBps = assets.data?.feeBps ?? 100;

  return (
    <PageShell>
      {back}

      <h1 className={styles.title}>Swap</h1>
      <p className={styles.lede}>
        Turn one coin in your balance into another. You'll see the rate, the route and CoinDrop's{" "}
        {feeLabel(feeBps)} fee before anything moves.
      </p>

      {balances.isPending || assets.isPending ? null : assets.isError ? (
        <section className={`panel ${styles.card}`}>
          <StateBlock tone="error" title="Swaps aren't available" onRetry={() => void assets.refetch()}>
            {toApiError(assets.error).message}
          </StateBlock>
        </section>
      ) : holdings.length === 0 ? (
        <section className={`panel ${styles.card}`}>
          <StateBlock title="Nothing to swap">
            You don't hold any coin that can be swapped yet. Deposit or get tipped, then come back.
          </StateBlock>
        </section>
      ) : !quote ? (
        <form className={`panel ${styles.card}`} onSubmit={handleReview}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="sw-from">
              From
            </label>
            <select
              id="sw-from"
              className={styles.select}
              value={activeFrom}
              onChange={(e) => {
                setFromSymbol(e.target.value);
                setAmount("");
              }}
            >
              {holdings.map((b) => (
                <option key={b.symbol} value={b.symbol}>
                  {b.symbol}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="sw-amount">
              Amount
            </label>
            <div className={styles.row}>
              <input
                id="sw-amount"
                className={styles.input}
                value={amount}
                onChange={(e) => {
                  if (/^\d*\.?\d*$/.test(e.target.value)) setAmount(e.target.value);
                }}
                placeholder="0.00"
                inputMode="decimal"
                autoComplete="off"
                required
              />
              {selected && (
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => setAmount(formatUnitsPlain(selected.amount, selected.decimals))}
                >
                  Max
                </button>
              )}
            </div>
            {selected && (
              <span className={styles.hint}>
                You hold {formatUnitsPlain(selected.amount, selected.decimals)} {selected.symbol}
              </span>
            )}
          </div>

          <div className={styles.row} style={{ justifyContent: "center" }}>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={flip}
              aria-label="Swap direction"
              disabled={!activeTo}
            >
              <Icon name="swap" size={16} style={{ transform: "rotate(90deg)" }} />
            </button>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="sw-to">
              To
            </label>
            <select
              id="sw-to"
              className={styles.select}
              value={activeTo}
              onChange={(e) => setToSymbol(e.target.value)}
            >
              {targets.map((a) => (
                <option key={a.symbol} value={a.symbol}>
                  {a.symbol} · {a.chainName}
                </option>
              ))}
            </select>
          </div>

          {quoteMutation.isError && (
            <p className={styles.error}>{toApiError(quoteMutation.error).message}</p>
          )}

          <div className={styles.actions}>
            <Button
              type="submit"
              variant="primary"
              disabled={quoteMutation.isPending || !activeTo || !(Number(amount) > 0)}
            >
              {quoteMutation.isPending ? "Finding the best route…" : "Review swap"}
            </Button>
          </div>
        </form>
      ) : (
        <section className={`panel ${styles.card}`}>
          <p className="eyebrow">Confirm swap</p>

          <div className={styles.breakdown}>
            <div className={styles.breakdownRow}>
              <span className={styles.breakdownLabel}>You pay</span>
              <span className={styles.breakdownAmount}>
                <span className="mono">
                  {formatUnits(quote.from.amount, quote.from.decimals)} {quote.from.symbol}
                </span>
                {quote.amountUsd && (
                  <span className={`${styles.breakdownUsd} mono`}>{money(quote.amountUsd)}</span>
                )}
              </span>
            </div>
            <div className={styles.breakdownRow} data-emphasis="true">
              <span className={styles.breakdownLabel}>You'll receive about</span>
              <span className={styles.breakdownAmount}>
                <span className="mono">
                  {formatUnits(quote.to.amount, quote.to.decimals)} {quote.to.symbol}
                </span>
                {quote.receiveUsd && (
                  <span className={`${styles.breakdownUsd} mono`}>{money(quote.receiveUsd)}</span>
                )}
              </span>
            </div>
            <div className={styles.breakdownRow}>
              <span className={styles.breakdownLabel}>Minimum received</span>
              <span className={`${styles.breakdownAmount} mono`}>
                {formatUnits(quote.to.minAmount, quote.to.decimals)} {quote.to.symbol}
              </span>
            </div>
            <div className={styles.breakdownRow}>
              <span className={styles.breakdownLabel}>CoinDrop fee</span>
              <span className={styles.breakdownAmount}>{feeLabel(quote.feeBps)}, included in the rate</span>
            </div>
            <div className={styles.breakdownRow}>
              <span className={styles.breakdownLabel}>Route</span>
              <span className={styles.breakdownAmount}>{routeLabel(quote.venue, quote.provider)}</span>
            </div>
            <div className={styles.breakdownRow}>
              <span className={styles.breakdownLabel}>Estimated time</span>
              <span className={styles.breakdownAmount}>{etaLabel(quote.etaSeconds)}</span>
            </div>
          </div>

          <p className={styles.hint} style={{ marginTop: "0.9rem" }}>
            Confirming takes {formatUnits(quote.from.amount, quote.from.decimals)} {quote.from.symbol}{" "}
            from your balance now. The {quote.to.symbol} is added when the swap completes; if it
            fails, your {quote.from.symbol} comes back.
          </p>

          <div className={styles.countdown} data-expired={expired}>
            {expired ? <span>This quote has expired.</span> : <span>Quote expires in {remaining}s</span>}
          </div>

          {notice && <p className={styles.hint}>{notice}</p>}
          {confirmMutation.isError && !notice && (
            <p className={styles.error}>{toApiError(confirmMutation.error).message}</p>
          )}
          {quoteMutation.isError && (
            <p className={styles.error}>{toApiError(quoteMutation.error).message}</p>
          )}

          <div className={styles.actions}>
            {expired ? (
              <Button type="button" variant="primary" onClick={requestQuote} disabled={quoteMutation.isPending}>
                {quoteMutation.isPending ? "Getting a new quote…" : "Get a new quote"}
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                onClick={handleConfirm}
                disabled={confirmMutation.isPending}
              >
                {confirmMutation.isPending ? "Starting swap…" : "Confirm swap"}
              </Button>
            )}
            <Button type="button" variant="outline" onClick={startOver} disabled={confirmMutation.isPending}>
              Cancel
            </Button>
          </div>
        </section>
      )}

      <div style={{ marginTop: "1.5rem" }}>
        <SwapHistoryCard />
      </div>
    </PageShell>
  );
}

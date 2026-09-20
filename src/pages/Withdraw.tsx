import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { PageShell } from "../components/PageShell";
import { Icon } from "../components/Icon";
import { Button } from "../components/Button";
import { StateBlock } from "../components/StateBlock";
import { toApiError } from "../api/http";
import { formatUnits, formatUnitsPlain, formatUsd, parseUnits } from "../lib/format";
import { useBalances } from "../features/wallet/useBalances";
import { useWithdrawConfirm, useWithdrawEstimate } from "../features/wallet/useWithdraw";
import type { WithdrawEstimate } from "../api/types";
import styles from "./WalletActions.module.css";

const MEMO_HINT_SYMBOLS = new Set(["WAX", "WAXP", "XRP", "XLM"]);

function useCountdown(expiresAt: number | null) {
  const [remaining, setRemaining] = useState(() =>
    expiresAt ? Math.max(0, Math.round((expiresAt - Date.now()) / 1000)) : 0,
  );

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => setRemaining(Math.max(0, Math.round((expiresAt - Date.now()) / 1000)));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  return remaining;
}

export function Withdraw() {
  const balances = useBalances();
  const holdings = (balances.data?.balances ?? []).filter((b) => /[1-9]/.test(b.amount));

  const [symbol, setSymbol] = useState<string>("");
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");

  const [estimate, setEstimate] = useState<WithdrawEstimate | null>(null);
  // the estimate response only carries smallest-unit integers — decimals comes
  // from the balance that was selected when the quote was requested
  const [estimateDecimals, setEstimateDecimals] = useState(0);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const remaining = useCountdown(expiresAt);
  const expired = estimate !== null && remaining <= 0;

  const estimateMutation = useWithdrawEstimate();
  const confirmMutation = useWithdrawConfirm();

  const activeSymbol = symbol || holdings[0]?.symbol || "";
  const selected = holdings.find((b) => b.symbol === activeSymbol);

  function requestEstimate() {
    if (!selected) return;
    const decimals = selected.decimals;
    estimateMutation.reset();
    estimateMutation.mutate(
      {
        symbol: activeSymbol,
        toAddress: toAddress.trim(),
        amount: parseUnits(amount.trim(), decimals),
        memo: memo.trim() || undefined,
      },
      {
        onSuccess: (data) => {
          setEstimate(data);
          setEstimateDecimals(decimals);
          setExpiresAt(Date.now() + data.expiresInSeconds * 1000);
        },
      },
    );
  }

  function handleReview(e: FormEvent) {
    e.preventDefault();
    requestEstimate();
  }

  function handleConfirm() {
    if (!estimate) return;
    confirmMutation.mutate(estimate.token, {
      onSuccess: () => setDone(true),
    });
  }

  function startOver() {
    setEstimate(null);
    setExpiresAt(null);
    setDone(false);
    confirmMutation.reset();
  }

  if (done) {
    return (
      <PageShell>
        <Link to="/wallet" className={styles.back}>
          <Icon name="arrowLeft" size={15} />
          Back to wallet
        </Link>
        <section className={`panel ${styles.card}`}>
          <div className={styles.doneWrap}>
            <StateBlock title="Withdrawal queued">
              Your {estimate?.currency} withdrawal is queued for processing — check the
              activity feed for its status.
            </StateBlock>
            <Link to="/wallet" className="btn btn--primary">
              Back to wallet
            </Link>
          </div>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Link to="/wallet" className={styles.back}>
        <Icon name="arrowLeft" size={15} />
        Back to wallet
      </Link>

      <h1 className={styles.title}>Withdraw</h1>
      <p className={styles.lede}>
        Send coins from your CoinDrop balance to an external address. Review the fees
        before confirming — withdrawals can't be undone.
      </p>

      {balances.isPending ? null : holdings.length === 0 ? (
        <section className={`panel ${styles.card}`}>
          <StateBlock title="Nothing to withdraw">
            Get tipped in Discord or Telegram, then come back here.
          </StateBlock>
        </section>
      ) : !estimate ? (
        <form className={`panel ${styles.card}`} onSubmit={handleReview}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="wd-symbol">
              Coin
            </label>
            <select
              id="wd-symbol"
              className={styles.select}
              value={activeSymbol}
              onChange={(e) => {
                setSymbol(e.target.value);
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
            <label className={styles.label} htmlFor="wd-address">
              Destination address
            </label>
            <input
              id="wd-address"
              className={styles.input}
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              placeholder="Paste the receiving address"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="wd-amount">
              Amount
            </label>
            <div className={styles.row}>
              <input
                id="wd-amount"
                className={styles.input}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                inputMode="decimal"
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

          <div className={styles.field}>
            <label className={styles.label} htmlFor="wd-memo">
              Memo / destination tag <span className={styles.hint}>(optional)</span>
            </label>
            <input
              id="wd-memo"
              className={styles.input}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="Only if your exchange or wallet asks for one"
            />
            {MEMO_HINT_SYMBOLS.has(activeSymbol) && (
              <span className={styles.hint}>
                {activeSymbol} withdrawals to an exchange usually need this.
              </span>
            )}
          </div>

          {estimateMutation.isError && (
            <p className={styles.error}>{toApiError(estimateMutation.error).message}</p>
          )}

          <div className={styles.actions}>
            <Button type="submit" variant="primary" disabled={estimateMutation.isPending}>
              {estimateMutation.isPending ? "Getting quote…" : "Review withdrawal"}
            </Button>
          </div>
        </form>
      ) : (
        <section className={`panel ${styles.card}`}>
          <p className="eyebrow">Confirm withdrawal</p>

          <div className={styles.breakdown}>
            <div className={styles.breakdownRow}>
              <span className={styles.breakdownLabel}>Amount</span>
              <span className={styles.breakdownAmount}>
                <span className="mono">
                  {formatUnits(estimate.amount, estimateDecimals)} {estimate.currency}
                </span>
                <span className={`${styles.breakdownUsd} mono`}>
                  {formatUsd(estimate.amountUsd)}
                </span>
              </span>
            </div>
            <div className={styles.breakdownRow}>
              <span className={styles.breakdownLabel}>Platform fee</span>
              <span className={styles.breakdownAmount}>
                <span className="mono">
                  −{formatUnits(estimate.platformFee, estimateDecimals)} {estimate.currency}
                </span>
                <span className={`${styles.breakdownUsd} mono`}>
                  {formatUsd(estimate.platformFeeUsd)}
                </span>
              </span>
            </div>
            <div className={styles.breakdownRow}>
              <span className={styles.breakdownLabel}>Network fee</span>
              <span className={styles.breakdownAmount}>
                <span className="mono">
                  −{formatUnits(estimate.gasFee, estimateDecimals)} {estimate.currency}
                </span>
                <span className={`${styles.breakdownUsd} mono`}>
                  {formatUsd(estimate.gasFeeUsd)}
                </span>
              </span>
            </div>
            <div className={styles.breakdownRow} data-emphasis="true">
              <span className={styles.breakdownLabel}>You'll receive</span>
              <span className={styles.breakdownAmount}>
                <span className="mono">
                  {formatUnits(estimate.sendAmount, estimateDecimals)} {estimate.currency}
                </span>
                <span className={`${styles.breakdownUsd} mono`}>
                  {formatUsd(estimate.sendAmountUsd)}
                </span>
              </span>
            </div>
          </div>

          <div className={styles.addressBlock}>
            <p className={styles.label}>To</p>
            <div className={styles.addressRow}>
              <span className={`${styles.address} mono`}>{estimate.toAddress}</span>
            </div>
            {estimate.memo && (
              <>
                <p className={styles.label} style={{ marginTop: "0.75rem" }}>
                  Memo
                </p>
                <div className={styles.addressRow}>
                  <span className={`${styles.address} mono`}>{estimate.memo}</span>
                </div>
              </>
            )}
          </div>

          <div className={styles.countdown} data-expired={expired}>
            {expired ? (
              <span>This quote has expired.</span>
            ) : (
              <span>Quote expires in {remaining}s</span>
            )}
          </div>

          {confirmMutation.isError && (
            <p className={styles.error}>{toApiError(confirmMutation.error).message}</p>
          )}

          <div className={styles.actions}>
            {expired ? (
              <Button type="button" variant="primary" onClick={requestEstimate}>
                Get a new quote
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                onClick={handleConfirm}
                disabled={confirmMutation.isPending}
              >
                {confirmMutation.isPending ? "Confirming…" : "Confirm withdrawal"}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={startOver}
              disabled={confirmMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </section>
      )}
    </PageShell>
  );
}

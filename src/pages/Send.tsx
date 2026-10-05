import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { PageShell } from "../components/PageShell";
import { Icon } from "../components/Icon";
import { Button } from "../components/Button";
import { StateBlock } from "../components/StateBlock";
import { SuccessCheck } from "../components/SuccessCheck";
import { toApiError } from "../api/http";
import { formatUnits, formatUnitsPlain, parseUnits } from "../lib/format";
import { useCountdown } from "../lib/useCountdown";
import { useCurrency } from "../features/currency/CurrencyContext";
import { useBalances } from "../features/wallet/useBalances";
import { useSendConfirm, useSendEstimate } from "../features/wallet/useSend";
import type { SendEstimate } from "../api/types";
import styles from "./WalletActions.module.css";

export function Send() {
  const { money } = useCurrency();
  const balances = useBalances();
  const holdings = (balances.data?.balances ?? []).filter((b) => /[1-9]/.test(b.amount));

  const [symbol, setSymbol] = useState<string>("");
  const [toPublicId, setToPublicId] = useState("");
  const [amount, setAmount] = useState("");

  const [estimate, setEstimate] = useState<SendEstimate | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [sent, setSent] = useState(false);

  const remaining = useCountdown(expiresAt);
  const expired = estimate !== null && remaining <= 0;

  const estimateMutation = useSendEstimate();
  const confirmMutation = useSendConfirm();

  const activeSymbol = symbol || holdings[0]?.symbol || "";
  const selected = holdings.find((b) => b.symbol === activeSymbol);

  // live USD hint while typing, priced off the cached balance snapshot —
  // not a quote, just a rough sense of scale before requesting the real one
  const heldUnits = selected ? Number(formatUnitsPlain(selected.amount, selected.decimals)) : 0;
  const pricePerUnit =
    selected?.usdValue && heldUnits > 0 ? Number(selected.usdValue) / heldUnits : null;
  const typedAmount = Number(amount);
  const estimatedUsd =
    pricePerUnit !== null && Number.isFinite(typedAmount) && typedAmount > 0
      ? typedAmount * pricePerUnit
      : null;

  function requestEstimate() {
    if (!selected) return;
    const id = Number(toPublicId.trim());
    if (!Number.isInteger(id) || id <= 0) return;
    estimateMutation.reset();
    estimateMutation.mutate(
      {
        toPublicId: id,
        symbol: activeSymbol,
        amount: parseUnits(amount.trim(), selected.decimals),
      },
      {
        onSuccess: (data) => {
          setEstimate(data);
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
      onSuccess: () => setSent(true),
    });
  }

  function startOver() {
    setEstimate(null);
    setExpiresAt(null);
    setSent(false);
    confirmMutation.reset();
  }

  if (sent && estimate) {
    return (
      <PageShell>
        <Link to="/wallet" className={styles.back}>
          <Icon name="arrowLeft" size={15} />
          Back to wallet
        </Link>
        <section className={`panel ${styles.card}`}>
          <div className={styles.doneWrap}>
            <SuccessCheck />
            <p className="eyebrow">Sent</p>
            <p className={styles.title}>
              {formatUnits(estimate.amount, estimate.decimals)} {estimate.symbol}
            </p>
            <p className={styles.lede}>
              to {estimate.toUsername}
              {estimate.toHandle ? ` (${estimate.toHandle})` : ""}
            </p>
            <Link to="/wallet" className="btn btn--primary" style={{ marginTop: "0.5rem" }}>
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

      <h1 className={styles.title}>Send</h1>
      <p className={styles.lede}>
        Send coins directly to another CoinDrop user by their CoinDrop ID — instant, no
        network fees. Sending to several people?{" "}
        <Link to="/wallet/send/bulk" style={{ textDecoration: "underline" }}>
          Upload a CSV instead
        </Link>
        .
      </p>

      {balances.isPending ? null : holdings.length === 0 ? (
        <section className={`panel ${styles.card}`}>
          <StateBlock title="Nothing to send">
            Get tipped in Discord or Telegram, then come back here.
          </StateBlock>
        </section>
      ) : !estimate ? (
        <form className={`panel ${styles.card}`} onSubmit={handleReview}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="snd-symbol">
              Coin
            </label>
            <select
              id="snd-symbol"
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
            <label className={styles.label} htmlFor="snd-to">
              Recipient's CoinDrop ID
            </label>
            <input
              id="snd-to"
              className={styles.input}
              value={toPublicId}
              onChange={(e) => setToPublicId(e.target.value)}
              placeholder="e.g. 5"
              inputMode="numeric"
              pattern="[0-9]*"
              required
            />
            <span className={styles.hint}>
              Not a username — ask the recipient for their CoinDrop ID.
            </span>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="snd-amount">
              Amount
            </label>
            <div className={styles.row}>
              <input
                id="snd-amount"
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
            {estimatedUsd !== null && (
              <span className={styles.hint}>≈ {money(estimatedUsd)}</span>
            )}
            {selected && (
              <span className={styles.hint}>
                You hold {formatUnitsPlain(selected.amount, selected.decimals)} {selected.symbol}
              </span>
            )}
          </div>

          {estimateMutation.isError && (
            <p className={styles.error}>{toApiError(estimateMutation.error).message}</p>
          )}

          <div className={styles.actions}>
            <Button type="submit" variant="primary" disabled={estimateMutation.isPending}>
              {estimateMutation.isPending ? "Looking up…" : "Review"}
            </Button>
          </div>
        </form>
      ) : (
        <section className={`panel ${styles.card}`}>
          <p className="eyebrow">Confirm send</p>

          <div className={styles.addressBlock} style={{ marginTop: "0.5rem" }}>
            <p className={styles.label}>To</p>
            <div className={styles.addressRow}>
              <Icon name="user" size={16} />
              <span className={`${styles.address} mono`}>
                {estimate.toUsername}
                {estimate.toHandle ? ` (${estimate.toHandle})` : ""}
              </span>
            </div>
            <span className={styles.hint}>
              Double-check this is who you meant to send to — sends can't be undone.
            </span>
          </div>

          <div className={styles.breakdown} style={{ marginTop: "0.5rem" }}>
            <div className={styles.breakdownRow} data-emphasis="true">
              <span className={styles.breakdownLabel}>Amount</span>
              <span className={styles.breakdownAmount}>
                <span className="mono">
                  {formatUnits(estimate.amount, estimate.decimals)} {estimate.symbol}
                </span>
                <span className={`${styles.breakdownUsd} mono`}>
                  {money(estimate.usdValue)}
                </span>
              </span>
            </div>
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
                {confirmMutation.isPending ? "Sending…" : "Confirm send"}
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

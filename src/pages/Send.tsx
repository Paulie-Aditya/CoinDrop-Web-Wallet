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
import type { SendEstimate, SendRecipient } from "../api/types";
import cardStyles from "../features/wallet/cards.module.css";
import styles from "./WalletActions.module.css";

type RecipientKind = "coindrop" | "discordId" | "discordUsername";

const RECIPIENT_KINDS: {
  id: RecipientKind;
  label: string;
  field: string;
  placeholder: string;
  hint: string;
}[] = [
  {
    id: "coindrop",
    label: "CoinDrop ID",
    field: "Recipient's CoinDrop ID",
    placeholder: "e.g. 5",
    hint: "The number shown on the recipient's CoinDrop profile.",
  },
  {
    id: "discordId",
    label: "Discord ID",
    field: "Recipient's Discord user ID",
    placeholder: "e.g. 123456789012345678",
    hint: "In Discord: Settings → Advanced → Developer Mode, then right-click them → Copy User ID.",
  },
  {
    id: "discordUsername",
    label: "Username",
    field: "Recipient's Discord username",
    placeholder: "e.g. @coinfan",
    hint: "Their username, not their display name. They need to have used CoinDrop before.",
  },
];

/** the API's recipient field for what was typed, or null if it can't be valid */
function toRecipient(kind: RecipientKind, raw: string): SendRecipient | null {
  const value = raw.trim();
  if (kind === "coindrop") {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? { toPublicId: id } : null;
  }
  if (kind === "discordId") return /^\d{17,20}$/.test(value) ? { toDiscordId: value } : null;
  const username = value.replace(/^@/, "");
  return username ? { toDiscordUsername: username } : null;
}

export function Send() {
  const { money } = useCurrency();
  const balances = useBalances();
  const holdings = (balances.data?.balances ?? []).filter((b) => /[1-9]/.test(b.amount));

  const [symbol, setSymbol] = useState<string>("");
  const [recipientKind, setRecipientKind] = useState<RecipientKind>("coindrop");
  const [recipientInput, setRecipientInput] = useState("");
  const kind = RECIPIENT_KINDS.find((k) => k.id === recipientKind)!;
  const recipient = toRecipient(recipientKind, recipientInput);
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
    if (!selected || !recipient) return;
    estimateMutation.reset();
    estimateMutation.mutate(
      {
        ...recipient,
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
        Send coins directly to another CoinDrop user by their CoinDrop ID, Discord ID, or
        Discord username — instant, no network fees. Sending to several people?{" "}
        <Link to="/wallet/send/bulk" style={{ textDecoration: "underline" }}>
          Upload a CSV instead
        </Link>
        .
      </p>

      {balances.isPending ? null : holdings.length === 0 ? (
        <section className={`panel ${styles.card}`}>
          <StateBlock title="Nothing to send">
            Get tipped in Discord, Telegram, or Kick, then come back here.
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
            <span className={styles.label} id="snd-to-kind">
              Send to
            </span>
            <div
              className={cardStyles.segmented}
              role="radiogroup"
              aria-labelledby="snd-to-kind"
              style={{ display: "flex", width: "100%", maxWidth: 420 }}
            >
              {RECIPIENT_KINDS.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  role="radio"
                  aria-checked={recipientKind === k.id}
                  className={cardStyles.segment}
                  style={{ flex: 1, whiteSpace: "nowrap" }}
                  data-active={recipientKind === k.id}
                  onClick={() => {
                    setRecipientKind(k.id);
                    setRecipientInput("");
                    estimateMutation.reset();
                  }}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="snd-to">
              {kind.field}
            </label>
            <input
              id="snd-to"
              className={styles.input}
              value={recipientInput}
              onChange={(e) => setRecipientInput(e.target.value)}
              placeholder={kind.placeholder}
              inputMode={recipientKind === "discordUsername" ? "text" : "numeric"}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              required
            />
            <span className={styles.hint}>{kind.hint}</span>
            {recipientInput.trim() !== "" && !recipient && (
              <span className={styles.error}>
                {recipientKind === "discordId"
                  ? "A Discord user ID is a 17–20 digit number."
                  : recipientKind === "discordUsername"
                    ? "Enter a username."
                    : "Enter a whole number."}
              </span>
            )}
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
            <Button
              type="submit"
              variant="primary"
              disabled={estimateMutation.isPending || !recipient}
            >
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
            <span className={`${styles.hint} mono`}>
              CoinDrop ID {estimate.toPublicId}
              {estimate.toDiscordId ? ` · Discord ID ${estimate.toDiscordId}` : ""}
            </span>
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

import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { PageShell } from "../components/PageShell";
import { Icon } from "../components/Icon";
import { StateBlock } from "../components/StateBlock";
import { toApiError } from "../api/http";
import { formatUnits, formatUnitsPlain, parseUnits } from "../lib/format";
import { useDebounced } from "../lib/useDebounced";
import { queryClient } from "../lib/queryClient";
import { useCurrency } from "../features/currency/CurrencyContext";
import { useBalances } from "../features/wallet/useBalances";
import {
  QUOTE_REFRESH_MS,
  quoteKey,
  useLiveSwapQuote,
  useSwapAssets,
  useSwapConfirm,
} from "../features/wallet/useSwap";
import { SwapStatusPanel } from "../features/wallet/SwapStatusPanel";
import { SwapHistoryCard } from "../features/wallet/SwapHistoryCard";
import { CoinMark, CoinPicker, type PickerCoin } from "../features/wallet/CoinPicker";
import { ROUTE_NAME, chainIconsFor, chainKey, etaLabel, feeLabel } from "../features/wallet/swapLabels";
import type { SwapAsset, SwapQuote } from "../api/types";
import styles from "./Swap.module.css";

/** Smallest units for a typed amount, or null when there's nothing to price. */
function unitsOf(amount: string, decimals: number): string | null {
  if (!/^\d*\.?\d+$/.test(amount.trim())) return null;
  const units = parseUnits(amount, decimals);
  return /[1-9]/.test(units) ? units : null;
}

/** "1 USDC = 0.000312 ETH", from what's actually swapped. */
function rateLabel(q: SwapQuote): string | null {
  const paid = Number(formatUnitsPlain(q.from.swapAmount ?? q.from.amount, q.from.decimals));
  const got = Number(formatUnitsPlain(q.to.amount, q.to.decimals));
  if (!(paid > 0) || !(got > 0)) return null;
  const rate = got / paid;
  const shown =
    rate >= 1
      ? rate.toLocaleString("en-US", { maximumFractionDigits: 4 })
      : rate.toLocaleString("en-US", { maximumSignificantDigits: 4 });
  return `1 ${q.from.symbol} = ${shown} ${q.to.symbol}`;
}

function CoinButton({
  asset,
  label,
  chainIcons,
  onClick,
}: {
  asset?: SwapAsset;
  label: string;
  chainIcons: Map<string, string>;
  onClick: () => void;
}) {
  return (
    <button type="button" className={styles.coin} onClick={onClick} aria-label={label}>
      {asset ? (
        <>
          <CoinMark coin={asset} size={30} chainIcon={chainIcons.get(chainKey(asset))} />
          <span className={styles.coinText}>
            <strong>{asset.symbol}</strong>
            <small>{asset.chainName}</small>
          </span>
        </>
      ) : (
        <span className={styles.coinText}>
          <strong>Choose</strong>
        </span>
      )}
      <Icon name="chevronDown" size={15} />
    </button>
  );
}

export function Swap() {
  const { money } = useCurrency();
  const balances = useBalances();
  const assets = useSwapAssets();
  const confirm = useSwapConfirm();

  const [fromSymbol, setFromSymbol] = useState("");
  const [toSymbol, setToSymbol] = useState("");
  const [amount, setAmount] = useState("");
  const [picker, setPicker] = useState<"from" | "to" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [swapId, setSwapId] = useState<number | null>(null);

  const swappable = assets.data?.assets ?? [];
  const held = new Map((balances.data?.balances ?? []).map((b) => [b.symbol, b.amount]));
  const holdings = swappable.filter((a) => /[1-9]/.test(held.get(a.symbol) ?? ""));
  // Each chain's own coin, for the small chain badge on tokens.
  const chainIcons = chainIconsFor(swappable);

  const from = holdings.find((a) => a.symbol === fromSymbol) ?? holdings[0];
  const targets = swappable.filter((a) => a.symbol !== from?.symbol);
  const to =
    targets.find((a) => a.symbol === toSymbol) ??
    targets.find((a) => a.chainName !== from?.chainName) ??
    targets[0];
  const balance = from ? held.get(from.symbol) ?? "0" : "0";

  const units = from ? unitsOf(amount, from.decimals) : null;
  const tooMuch = units !== null && BigInt(units) > BigInt(balance);
  const settled = useDebounced(units, 600);
  const input =
    from && to && units !== null && !tooMuch && settled === units
      ? { fromSymbol: from.symbol, toSymbol: to.symbol, amount: units }
      : null;

  const live = useLiveSwapQuote(input, confirm.isPending);
  const quote = input ? live.data : undefined;
  const pricing = units !== null && !tooMuch && (settled !== units || (live.isFetching && !quote));
  const quoteError = input && live.isError && !live.isFetching ? toApiError(live.error).message : null;

  function pick(side: "from" | "to", symbol: string) {
    setNotice(null);
    if (side === "from") {
      if (symbol === to?.symbol) setToSymbol(from?.symbol ?? "");
      setFromSymbol(symbol);
      setAmount("");
    } else {
      setToSymbol(symbol);
    }
  }

  const canFlip = !!to && holdings.some((a) => a.symbol === to.symbol);
  function flip() {
    if (!from || !to || !canFlip) return;
    setFromSymbol(to.symbol);
    setToSymbol(from.symbol);
    setAmount("");
    setNotice(null);
  }

  function handleSwap(e: FormEvent) {
    e.preventDefault();
    if (!quote || !input) return;
    setNotice(null);
    confirm.mutate(quote.token, {
      onSuccess: ({ swap }) => setSwapId(swap.id),
      onError: (err) => {
        // The price moved: show the new quote in place and let them swap again.
        const fresh = axios.isAxiosError(err) ? (err.response?.data as { quote?: SwapQuote })?.quote : undefined;
        if (fresh) {
          queryClient.setQueryData(quoteKey(input), fresh);
          setNotice("The price changed. Check the new amount and swap again.");
          confirm.reset();
        } else if (axios.isAxiosError(err) && err.response?.status === 409) {
          void live.refetch();
        }
      },
    });
  }

  function startOver() {
    setSwapId(null);
    setAmount("");
    setNotice(null);
    confirm.reset();
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
        <div className={styles.stage}>
          {back}
          <section className={`${styles.glass} ${styles.statusCard}`}>
            <SwapStatusPanel id={swapId} />
            <button type="button" className={`btn btn--outline btn--block ${styles.again}`} onClick={startOver}>
              Make another swap
            </button>
          </section>
          <div className={styles.history}>
            <SwapHistoryCard />
          </div>
        </div>
      </PageShell>
    );
  }

  const feeBps = assets.data?.feeBps ?? 100;
  const busy = confirm.isPending;

  let action = `Swap ${from?.symbol ?? ""} for ${to?.symbol ?? ""}`;
  if (busy) action = "Starting swap…";
  else if (units === null) action = "Enter an amount";
  else if (tooMuch) action = `Not enough ${from?.symbol}`;
  else if (pricing) action = "Finding the best price…";
  else if (quoteError) action = "Can't swap this right now";

  const pickerCoins: PickerCoin[] = (picker === "from" ? holdings : targets).map((a) => ({
    symbol: a.symbol,
    chainName: a.chainName,
    chainId: a.chainId,
    isToken: a.isToken,
    decimals: a.decimals,
    balance: /[1-9]/.test(held.get(a.symbol) ?? "") ? held.get(a.symbol) : undefined,
  }));

  return (
    <PageShell>
      <div className={styles.stage}>
        {back}
        <header className={styles.intro}>
          <h1 className={styles.title}>Swap</h1>
          <p className={styles.lede}>
            Turn one coin in your balance into another, at the best price {ROUTE_NAME} finds. CoinDrop's{" "}
            {feeLabel(feeBps)} fee is included in the rate.
          </p>
        </header>

        {balances.isPending || assets.isPending ? (
          <div className={`${styles.glass} ${styles.swap}`} aria-busy="true">
            <span className={`${styles.skeleton} ${styles.skeletonBlock}`} />
            <span className={`${styles.skeleton} ${styles.skeletonBlock}`} />
          </div>
        ) : assets.isError ? (
          <section className={`${styles.glass} ${styles.statusCard}`}>
            <StateBlock tone="error" title="Swaps aren't available" onRetry={() => void assets.refetch()}>
              {toApiError(assets.error).message}
            </StateBlock>
          </section>
        ) : holdings.length === 0 ? (
          <section className={`${styles.glass} ${styles.statusCard}`}>
            <StateBlock title="Nothing to swap yet">
              You don't hold a coin that can be swapped. Deposit or get tipped, then come back.
            </StateBlock>
          </section>
        ) : (
          <form className={`${styles.glass} ${styles.swap}`} onSubmit={handleSwap}>
            <fieldset disabled={busy} className={styles.fields}>
              <div className={styles.panel}>
                <div className={styles.panelHead}>
                  <label htmlFor="swap-amount">You pay</label>
                  {from && (
                    <span className={styles.balance}>
                      Balance <span className="mono">{formatUnits(balance, from.decimals)}</span>
                      <button
                        type="button"
                        className={styles.max}
                        onClick={() => setAmount(formatUnitsPlain(balance, from.decimals))}
                      >
                        Max
                      </button>
                    </span>
                  )}
                </div>
                <div className={styles.panelRow}>
                  <input
                    id="swap-amount"
                    className={styles.amount}
                    value={amount}
                    onChange={(e) => {
                      const next = e.target.value.replace(",", ".");
                      if (/^\d*\.?\d*$/.test(next)) {
                        setAmount(next);
                        setNotice(null);
                      }
                    }}
                    placeholder="0"
                    inputMode="decimal"
                    autoComplete="off"
                    aria-invalid={tooMuch || undefined}
                  />
                  <CoinButton
                    asset={from}
                    label="Choose the coin to pay with"
                    chainIcons={chainIcons}
                    onClick={() => setPicker("from")}
                  />
                </div>
                <p className={styles.sub} data-tone={tooMuch ? "error" : undefined}>
                  {tooMuch
                    ? `You hold ${formatUnits(balance, from?.decimals ?? 0)} ${from?.symbol}`
                    : quote?.amountUsd
                      ? money(quote.amountUsd)
                      : " "}
                </p>
              </div>

              <button
                type="button"
                className={styles.flip}
                onClick={flip}
                disabled={!canFlip}
                aria-label="Swap the two coins"
                title={canFlip ? "Swap the two coins" : `You don't hold any ${to?.symbol ?? ""}`}
              >
                <Icon name="arrowDown" size={17} />
              </button>

              <div className={styles.panel}>
                <div className={styles.panelHead}>
                  <span>You receive</span>
                </div>
                <div className={styles.panelRow}>
                  <output className={styles.amount} data-empty={!quote || pricing || undefined} aria-live="polite">
                    {pricing ? (
                      <span className={`${styles.skeleton} ${styles.skeletonAmount}`} />
                    ) : quote ? (
                      <span className={styles.tick} key={quote.to.amount}>
                        {formatUnits(quote.to.amount, quote.to.decimals)}
                      </span>
                    ) : (
                      "0"
                    )}
                  </output>
                  <CoinButton
                    asset={to}
                    label="Choose the coin to receive"
                    chainIcons={chainIcons}
                    onClick={() => setPicker("to")}
                  />
                </div>
                <p className={styles.sub} data-tone={quoteError ? "error" : undefined}>
                  {quoteError ?? (quote?.receiveUsd && !pricing ? money(quote.receiveUsd) : " ")}
                </p>
              </div>

              {quote && !pricing && (
                <details className={styles.details}>
                  <summary>
                    <span className={styles.rate}>{rateLabel(quote)}</span>
                    {!busy && (
                      <span
                        className={styles.ring}
                        key={live.dataUpdatedAt}
                        style={{ animationDuration: `${QUOTE_REFRESH_MS}ms` }}
                        title="Time until this price refreshes"
                      />
                    )}
                    <Icon name="chevronDown" size={14} className={styles.chevron} />
                  </summary>
                  <dl>
                    <div>
                      <dt>Network fee</dt>
                      <dd className="mono">
                        {formatUnits(quote.networkFee ?? "0", quote.from.decimals)} {quote.from.symbol}
                      </dd>
                    </div>
                    <div>
                      <dt>Swapped</dt>
                      <dd className="mono">
                        {formatUnits(quote.from.swapAmount ?? quote.from.amount, quote.from.decimals)} {quote.from.symbol}
                      </dd>
                    </div>
                    <div>
                      <dt>Minimum received</dt>
                      <dd className="mono">
                        {formatUnits(quote.to.minAmount, quote.to.decimals)} {quote.to.symbol}
                      </dd>
                    </div>
                    <div>
                      <dt>CoinDrop fee</dt>
                      <dd>{feeLabel(quote.feeBps)}, in the rate</dd>
                    </div>
                    <div>
                      <dt>Route</dt>
                      <dd>{ROUTE_NAME}</dd>
                    </div>
                    <div>
                      <dt>Estimated time</dt>
                      <dd>{etaLabel(quote.etaSeconds)}</dd>
                    </div>
                  </dl>
                </details>
              )}

              {notice && (
                <p className={styles.notice} role="status">
                  {notice}
                </p>
              )}
              {confirm.isError && !notice && (
                <p className={styles.notice} data-tone="error" role="alert">
                  {toApiError(confirm.error).message}
                </p>
              )}

              <button
                type="submit"
                className={`btn btn--primary btn--block ${styles.action}`}
                disabled={!quote || pricing || busy || tooMuch}
                aria-busy={busy || undefined}
              >
                {busy && <span className={styles.spinner} aria-hidden="true" />}
                {action}
              </button>
              <p className={styles.note}>
                {quote && from
                  ? `Confirming takes ${formatUnits(quote.from.amount, from.decimals)} ${from.symbol} from your balance, network fee included. If the swap fails, it comes back.`
                  : "Nothing leaves your balance until you confirm."}
              </p>
            </fieldset>
          </form>
        )}

        <div className={styles.history}>
          <SwapHistoryCard />
        </div>
      </div>

      {picker && (
        <CoinPicker
          title={picker === "from" ? "Pay with" : "Receive"}
          coins={pickerCoins}
          selected={picker === "from" ? from?.symbol : to?.symbol}
          chainIcons={chainIcons}
          onPick={(symbol) => pick(picker, symbol)}
          onClose={() => setPicker(null)}
        />
      )}
    </PageShell>
  );
}

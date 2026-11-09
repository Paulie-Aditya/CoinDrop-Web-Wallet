import { useState } from "react";
import { Link } from "react-router-dom";
import { PageShell } from "../components/PageShell";
import { Icon } from "../components/Icon";
import { CopyButton } from "../components/CopyButton";
import { CoinLoader } from "../components/CoinLoader";
import { StateBlock } from "../components/StateBlock";
import { toApiError } from "../api/http";
import { useBalances, useCurrencies } from "../features/wallet/useBalances";
import { CoinField } from "../features/wallet/CoinField";
import type { PickerCoin } from "../features/wallet/CoinPicker";
import { chainIconsFor } from "../features/wallet/swapLabels";
import { useDepositAddress } from "../features/wallet/useDeposit";
import styles from "./WalletActions.module.css";

export function Deposit() {
  const balances = useBalances();
  const currencies = useCurrencies();
  const held = new Map((balances.data?.balances ?? []).map((b) => [b.symbol, b]));

  // Every coin that can be deposited; before the backend lists them, the coins you hold.
  const coins: PickerCoin[] = currencies.data
    ? currencies.data
        .filter((c) => c.depositable)
        .map((c) => ({
          symbol: c.symbol,
          chainName: c.chainName ?? "",
          chainId: c.chainId ?? undefined,
          isToken: c.isToken,
          decimals: c.decimals,
          balance: held.get(c.symbol)?.amount,
        }))
    : [...held.values()]
        .sort((a, b) => a.symbol.localeCompare(b.symbol))
        .map((b) => ({
          symbol: b.symbol,
          chainName: b.chainName ?? "",
          chainId: b.chainId ?? undefined,
          isToken: b.isToken,
          decimals: b.decimals,
          balance: b.amount,
        }));
  const chainIcons = chainIconsFor(currencies.data ?? [...held.values()]);
  // Only without the full list can a coin be missing from the picker.
  const canTypeSymbol = !currencies.data && !currencies.isPending;

  const [symbol, setSymbol] = useState<string | null>(null);
  const [useCustom, setUseCustom] = useState(false);
  const [customSymbol, setCustomSymbol] = useState("");

  const firstHeld = [...held.keys()].sort()[0] ?? null;
  const typing = canTypeSymbol && (useCustom || coins.length === 0);
  const activeSymbol = typing ? customSymbol.trim().toUpperCase() || null : symbol ?? firstHeld;
  const deposit = useDepositAddress(activeSymbol);

  return (
    <PageShell>
      <Link to="/wallet" className={styles.back}>
        <Icon name="arrowLeft" size={15} />
        Back to wallet
      </Link>

      <h1 className={styles.title}>Deposit</h1>
      <p className={styles.lede}>
        Send crypto to your CoinDrop address and it'll show up in your balance once it
        confirms on-chain.
      </p>

      <section className={`panel ${styles.card}`}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="deposit-symbol">
            Coin
          </label>

          {!typing ? (
            <>
              <CoinField
                id="deposit-symbol"
                title="Deposit"
                coins={coins}
                value={activeSymbol}
                onChange={setSymbol}
                chainIcons={chainIcons}
              />
              {canTypeSymbol && (
                <button
                  type="button"
                  className={`btn btn--ghost btn--sm ${styles.inlineLink}`}
                  onClick={() => setUseCustom(true)}
                >
                  Coin not listed?
                </button>
              )}
            </>
          ) : (
            <div className={styles.row}>
              <input
                id="deposit-symbol"
                className={styles.input}
                placeholder="e.g. XLM"
                value={customSymbol}
                onChange={(e) => setCustomSymbol(e.target.value)}
                maxLength={10}
                autoFocus
              />
              {coins.length > 0 && (
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => setUseCustom(false)}>
                  Choose from list
                </button>
              )}
            </div>
          )}
        </div>

        {activeSymbol ? (
          <div>
            {deposit.isPending ? (
              <CoinLoader label="Getting your address" />
            ) : deposit.isError ? (
              <StateBlock
                tone="error"
                title={`Can't deposit ${activeSymbol}`}
                onRetry={() => void deposit.refetch()}
              >
                {toApiError(deposit.error).message}
              </StateBlock>
            ) : deposit.data ? (
              <>
                <p className="eyebrow">{deposit.data.chainName} address</p>
                <div className={styles.addressRow}>
                  <span className={`${styles.address} mono`}>{deposit.data.address}</span>
                  <CopyButton value={deposit.data.address} />
                </div>

                {(deposit.data.memo || deposit.data.destinationTag) && (
                  <div className={styles.warning}>
                    <Icon name="alertTriangle" size={16} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className={styles.warningTitle}>
                        {deposit.data.memo ? "Memo required" : "Destination tag required"}
                      </p>
                      <p className={styles.warningBody}>
                        This address is shared with other users. Without the{" "}
                        {deposit.data.memo ? "memo" : "tag"} below, your deposit can't be
                        credited to your account.
                      </p>
                      <div className={styles.addressRow}>
                        <span className={`${styles.address} mono`}>
                          {deposit.data.memo ?? deposit.data.destinationTag}
                        </span>
                        <CopyButton
                          value={(deposit.data.memo ?? deposit.data.destinationTag) as string}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        ) : null}
      </section>
    </PageShell>
  );
}

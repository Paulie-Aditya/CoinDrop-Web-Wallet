import { useState } from "react";
import { Link } from "react-router-dom";
import { PageShell } from "../components/PageShell";
import { Icon } from "../components/Icon";
import { CopyButton } from "../components/CopyButton";
import { CoinLoader } from "../components/CoinLoader";
import { StateBlock } from "../components/StateBlock";
import { toApiError } from "../api/http";
import { useBalances } from "../features/wallet/useBalances";
import { useDepositAddress } from "../features/wallet/useDeposit";
import styles from "./WalletActions.module.css";

export function Deposit() {
  const balances = useBalances();
  const knownSymbols = [...new Set((balances.data?.balances ?? []).map((b) => b.symbol))].sort();

  const [symbol, setSymbol] = useState<string | null>(knownSymbols[0] ?? null);
  const [useCustom, setUseCustom] = useState(knownSymbols.length === 0);
  const [customSymbol, setCustomSymbol] = useState("");

  const activeSymbol = useCustom ? customSymbol.trim().toUpperCase() || null : symbol;
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

          {!useCustom ? (
            <div className={styles.row}>
              <select
                id="deposit-symbol"
                className={styles.select}
                value={symbol ?? ""}
                onChange={(e) => setSymbol(e.target.value || null)}
              >
                {knownSymbols.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => setUseCustom(true)}
              >
                Different coin?
              </button>
            </div>
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
              {knownSymbols.length > 0 && (
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => setUseCustom(false)}
                >
                  Choose from balances
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

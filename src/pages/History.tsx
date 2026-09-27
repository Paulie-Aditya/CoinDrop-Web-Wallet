import { useState } from "react";
import { Link } from "react-router-dom";
import { PageShell } from "../components/PageShell";
import { Icon } from "../components/Icon";
import { DepositHistoryCard } from "../features/wallet/DepositHistoryCard";
import { WithdrawHistoryCard } from "../features/wallet/WithdrawHistoryCard";
import cardStyles from "../features/wallet/cards.module.css";
import styles from "./WalletActions.module.css";

type Tab = "deposits" | "withdrawals";

export function History() {
  const [tab, setTab] = useState<Tab>("deposits");

  return (
    <PageShell>
      <Link to="/wallet" className={styles.back}>
        <Icon name="arrowLeft" size={15} />
        Back to wallet
      </Link>

      <h1 className={styles.title}>History</h1>
      <p className={styles.lede}>
        Every deposit and withdrawal on your account, separate from the combined
        activity feed.
      </p>

      <div className={cardStyles.segmented} role="tablist" aria-label="History type" style={{ marginTop: "1.25rem" }}>
        <button
          role="tab"
          aria-selected={tab === "deposits"}
          className={cardStyles.segment}
          data-active={tab === "deposits"}
          onClick={() => setTab("deposits")}
        >
          Deposits
        </button>
        <button
          role="tab"
          aria-selected={tab === "withdrawals"}
          className={cardStyles.segment}
          data-active={tab === "withdrawals"}
          onClick={() => setTab("withdrawals")}
        >
          Withdrawals
        </button>
      </div>

      <div style={{ marginTop: "1.25rem" }}>
        {tab === "deposits" ? <DepositHistoryCard /> : <WithdrawHistoryCard />}
      </div>
    </PageShell>
  );
}

import { Link } from "react-router-dom";
import { PageShell } from "../components/PageShell";
import { Icon } from "../components/Icon";
import { BalancesCard } from "../features/wallet/BalancesCard";
import { ActivityCard } from "../features/wallet/ActivityCard";
import styles from "./Wallet.module.css";

export function Wallet() {
  return (
    <PageShell>
      <div className={styles.actions}>
        <button className="btn btn--outline" disabled aria-disabled="true">
          <Icon name="arrowUpRight" size={16} />
          Send
          <span className={styles.soon}>Soon</span>
        </button>
        <Link to="/wallet/deposit" className="btn btn--outline">
          <Icon name="arrowDownLeft" size={16} />
          Deposit
        </Link>
        <Link to="/wallet/withdraw" className="btn btn--outline">
          <Icon name="external" size={16} />
          Withdraw
        </Link>
      </div>

      <div className={styles.stack}>
        <BalancesCard />
        <ActivityCard />
      </div>
    </PageShell>
  );
}

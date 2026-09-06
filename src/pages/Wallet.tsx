import { PageShell } from "../components/PageShell";
import { Icon } from "../components/Icon";
import { BalancesCard } from "../features/wallet/BalancesCard";
import { ActivityCard } from "../features/wallet/ActivityCard";
import styles from "./Wallet.module.css";

const SOON = [
  { label: "Send", icon: "arrowUpRight" as const },
  { label: "Deposit", icon: "arrowDownLeft" as const },
  { label: "Withdraw", icon: "external" as const },
];

export function Wallet() {
  return (
    <PageShell>
      <div className={styles.actions}>
        {SOON.map((a) => (
          <button key={a.label} className="btn btn--outline" disabled aria-disabled="true">
            <Icon name={a.icon} size={16} />
            {a.label}
            <span className={styles.soon}>Soon</span>
          </button>
        ))}
      </div>

      <div className={styles.stack}>
        <BalancesCard />
        <ActivityCard />
      </div>
    </PageShell>
  );
}

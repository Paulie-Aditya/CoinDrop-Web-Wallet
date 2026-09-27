import { Link } from "react-router-dom";
import { PageShell } from "../components/PageShell";
import { Icon } from "../components/Icon";
import { BalancesCard } from "../features/wallet/BalancesCard";
import { ActivityCard } from "../features/wallet/ActivityCard";
import { Coachmarks, type CoachmarkStep } from "../features/onboarding/Coachmarks";
import styles from "./Wallet.module.css";

const TOUR_STEPS: CoachmarkStep[] = [
  {
    target: "balances",
    title: "Your balances",
    body: "Every coin you hold, with its live USD value and a running total.",
  },
  {
    target: "deposit",
    title: "Deposit",
    body: "Get an address — plus a memo or destination tag, when the coin needs one — for any supported coin.",
  },
  {
    target: "withdraw",
    title: "Withdraw",
    body: "Send coins out in two steps: review the fee breakdown and a 30-second quote before anything actually moves.",
  },
  {
    target: "history",
    title: "History",
    body: "Full deposit and withdrawal history, separate from the combined activity feed below.",
  },
  {
    target: "notifications",
    title: "Notifications",
    body: "This bell lights up the moment a deposit lands on your account.",
  },
];

export function Wallet() {
  return (
    <PageShell>
      <div className={styles.actions}>
        <button className="btn btn--outline" disabled aria-disabled="true">
          <Icon name="arrowUpRight" size={16} />
          Send
          <span className={styles.soon}>Soon</span>
        </button>
        <Link to="/wallet/deposit" className="btn btn--outline" data-coachmark="deposit">
          <Icon name="arrowDownLeft" size={16} />
          Deposit
        </Link>
        <Link to="/wallet/withdraw" className="btn btn--outline" data-coachmark="withdraw">
          <Icon name="external" size={16} />
          Withdraw
        </Link>
        <Link to="/wallet/history" className="btn btn--outline" data-coachmark="history">
          <Icon name="list" size={16} />
          History
        </Link>
      </div>

      <div className={styles.stack}>
        <BalancesCard />
        <ActivityCard />
      </div>

      <Coachmarks steps={TOUR_STEPS} storageKey="coindrop.tour.wallet.v1" />
    </PageShell>
  );
}

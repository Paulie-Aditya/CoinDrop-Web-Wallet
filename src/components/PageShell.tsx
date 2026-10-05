import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Wordmark } from "./Wordmark";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";
import { useSession } from "../features/auth/useSession";
import { useLogout } from "../features/auth/useLogout";
import { useCurrency } from "../features/currency/CurrencyContext";
import { NotificationBell } from "../features/notifications/NotificationBell";
import styles from "./PageShell.module.css";

let currencyNames: Intl.DisplayNames | null = null;
/** Full name for the tooltip on each <option> — the closed <select> always
 *  shows the selected option's own text, so that stays just the code. */
function currencyName(code: string): string | undefined {
  if (code === "USD") return "US Dollar";
  try {
    currencyNames ??= new Intl.DisplayNames(["en"], { type: "currency" });
    const name = currencyNames.of(code);
    return name && name !== code ? name : undefined;
  } catch {
    return undefined;
  }
}

export function PageShell({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const logout = useLogout();
  const { code, setCode, codes } = useCurrency();

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/wallet" className={styles.brand} aria-label="CoinDrop wallet home">
            <Wordmark size={20} />
          </Link>

          {user ? (
            <div className={styles.user}>
              <div className={styles.currencyWrap}>
                <Icon name="globe" size={14} className={styles.currencyIcon} />
                <select
                  className={styles.currencySelect}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  aria-label="Display currency"
                >
                  {codes.map((c) => (
                    <option key={c} value={c} title={currencyName(c)}>
                      {c}
                    </option>
                  ))}
                </select>
                <Icon name="chevronDown" size={13} className={styles.currencyChevron} />
              </div>
              <NotificationBell />
              <Link to="/wallet/profile" className={styles.identity}>
                <Avatar username={user.username} src={user.avatarUrl} size={28} />
                <span className={styles.username}>{user.username}</span>
              </Link>
              <button
                className="btn btn--ghost btn--sm"
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
              >
                <Icon name="logout" size={15} />
                <span className={styles.logoutLabel}>Log out</span>
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <main className={styles.main}>{children}</main>
    </div>
  );
}

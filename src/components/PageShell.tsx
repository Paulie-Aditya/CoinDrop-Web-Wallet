import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Wordmark } from "./Wordmark";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";
import { useSession } from "../features/auth/useSession";
import { useLogout } from "../features/auth/useLogout";
import styles from "./PageShell.module.css";

export function PageShell({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const logout = useLogout();

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/wallet" className={styles.brand} aria-label="CoinDrop wallet home">
            <Wordmark size={20} />
          </Link>

          {user ? (
            <div className={styles.user}>
              <span className={styles.identity}>
                <Avatar username={user.username} src={user.avatarUrl} size={28} />
                <span className={styles.username}>{user.username}</span>
              </span>
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

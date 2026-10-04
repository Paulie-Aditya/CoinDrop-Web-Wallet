import { Link } from "react-router-dom";
import { PageShell } from "../components/PageShell";
import { Icon } from "../components/Icon";
import { Avatar } from "../components/Avatar";
import { CopyButton } from "../components/CopyButton";
import { CoinLoader } from "../components/CoinLoader";
import { useSession } from "../features/auth/useSession";
import styles from "./WalletActions.module.css";

const PLATFORM_LABEL: Record<string, string> = {
  discord: "Discord",
  telegram: "Telegram",
  google: "Google",
};

export function Profile() {
  const { user, isPending } = useSession();

  return (
    <PageShell>
      <Link to="/wallet" className={styles.back}>
        <Icon name="arrowLeft" size={15} />
        Back to wallet
      </Link>

      <h1 className={styles.title}>Profile</h1>
      <p className={styles.lede}>
        Your CoinDrop ID is what other users enter to send you coins directly —
        share it the way you'd share a username.
      </p>

      <section className={`panel ${styles.card}`}>
        {isPending || !user ? (
          <CoinLoader label="Loading" />
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <Avatar username={user.username} src={user.avatarUrl} size={48} />
              <div>
                <p style={{ fontWeight: 600 }}>{user.username}</p>
                <p className={styles.hint}>
                  {user.handle ? `${user.handle} · ` : ""}
                  {PLATFORM_LABEL[user.platform] ?? user.platform}
                </p>
              </div>
            </div>

            <div className={styles.addressBlock}>
              <p className={styles.label}>Your CoinDrop ID</p>
              <div className={styles.addressRow}>
                <span className={`${styles.address} mono`} style={{ fontSize: "1.1rem" }}>
                  {user.publicId}
                </span>
                <CopyButton value={String(user.publicId)} />
              </div>
              <span className={styles.hint}>
                Give this to someone so they can send you coins from their own Send screen.
              </span>
            </div>
          </>
        )}
      </section>
    </PageShell>
  );
}

import { Navigate, useLocation } from "react-router-dom";
import { Wordmark } from "../components/Wordmark";
import { CoinLoader } from "../components/CoinLoader";
import { BrandIcon } from "../components/Icon";
import { AUTH_PROVIDERS, startLogin } from "../api/auth";
import { useSession } from "../features/auth/useSession";
import styles from "./Login.module.css";

export function Login() {
  const location = useLocation();
  const { isPending, isAuthenticated } = useSession();
  const from = (location.state as { from?: string } | null)?.from;

  if (isPending) return <CoinLoader label="Checking your session" />;
  if (isAuthenticated) return <Navigate to={from ?? "/wallet"} replace />;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Wordmark size={26} />
        <h1 className={styles.title}>Log in to your wallet</h1>
        <p className={styles.lede}>
          Use the same account you use with the CoinDrop bot. Your balances carry
          straight over.
        </p>

        <div className={styles.providers}>
          {AUTH_PROVIDERS.map((provider) => (
            <button
              key={provider.id}
              className={`btn ${provider.enabled ? "btn--primary" : "btn--outline"} btn--block`}
              onClick={() => startLogin(provider.id, from ? `/auth/callback?from=${encodeURIComponent(from)}` : "/auth/callback")}
              disabled={!provider.enabled}
              aria-disabled={!provider.enabled}
            >
              <BrandIcon name={provider.id} size={17} />
              Continue with {provider.label}
              {!provider.enabled ? <span className={styles.soon}>Soon</span> : null}
            </button>
          ))}
        </div>

        <p className={styles.fine}>
          Telegram and Google sign-in are on the way. Link them from the bot's{" "}
          <code>/link</code> command in the meantime.
        </p>
      </div>
    </div>
  );
}

import { Link } from "react-router-dom";
import { Wordmark } from "../components/Wordmark";
import { LogoMark } from "../components/LogoMark";
import { Icon } from "../components/Icon";
import styles from "./Landing.module.css";

const SEEN = [
  ["Balances", "Every coin you hold, with its live USD value and a running total."],
  ["Deposit & withdraw", "Move coins in from anywhere, or send them out to an external address."],
  ["Activity", "Every tip, drop, deposit and withdrawal, filterable by coin and direction."],
];

export function Landing() {
  return (
    <div className={styles.page}>
      <header className={styles.nav}>
        <Wordmark size={22} />
        <Link to="/login" className="btn btn--primary btn--sm">
          Open wallet
          <Icon name="arrowRight" size={15} />
        </Link>
      </header>

      <main className={styles.hero}>
        <div className={styles.copy}>
          <p className="eyebrow">CoinDrop Wallet</p>
          <h1 className={styles.headline}>
            Every coin you hold, in one place.
          </h1>
          <p className={styles.sub}>
            Log in with the account you already use with the bot. See your
            balances, deposit or withdraw any coin, and track every tip and
            drop as it happens.
          </p>
          <div className={styles.actions}>
            <Link to="/login" className="btn btn--primary">
              Open your wallet
              <Icon name="arrowRight" size={16} />
            </Link>
            <a
              className="btn btn--ghost"
              href="https://coindrop.cc"
              target="_blank"
              rel="noreferrer"
            >
              About CoinDrop
              <Icon name="external" size={15} />
            </a>
          </div>
        </div>

        <div className={styles.art} aria-hidden="true">
          <span className={styles.glow} />
          <span className={styles.coin}>
            <LogoMark size={168} />
          </span>
        </div>
      </main>

      <section className={styles.seen}>
        {SEEN.map(([title, body]) => (
          <div key={title} className={styles.seenItem}>
            <h2 className={styles.seenTitle}>{title}</h2>
            <p className={styles.seenBody}>{body}</p>
          </div>
        ))}
      </section>

      <footer className={styles.footer}>
        <span>© 2026 CoinDrop</span>
        <span className={styles.footerLinks}>
          <a href="https://coindrop.cc" target="_blank" rel="noreferrer">
            coindrop.cc
          </a>
          <span>0% tips · 0.5% deposits & withdrawals</span>
        </span>
      </footer>
    </div>
  );
}

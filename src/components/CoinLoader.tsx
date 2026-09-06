import { LogoMark } from "./LogoMark";
import styles from "./CoinLoader.module.css";

interface CoinLoaderProps {
  label?: string;
  size?: number;
}

/** The signature: a coin that drops and settles. Full-bleed centered block. */
export function CoinLoader({ label = "Loading", size = 46 }: CoinLoaderProps) {
  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <div className={styles.stage}>
        <span className={styles.coin}>
          <LogoMark size={size} />
        </span>
        <span className={styles.shadow} />
      </div>
      <span className={styles.label}>{label}…</span>
    </div>
  );
}

import { LogoMark } from "./LogoMark";
import styles from "./Wordmark.module.css";

/** Logo lockup: the coin+drop mark next to "CoinDrop". */
export function Wordmark({ size = 20 }: { size?: number }) {
  return (
    <span className={styles.lockup} style={{ fontSize: size }}>
      <LogoMark size={size * 1.25} />
      CoinDrop
    </span>
  );
}

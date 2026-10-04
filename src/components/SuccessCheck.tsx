import styles from "./SuccessCheck.module.css";

interface SuccessCheckProps {
  size?: number;
}

/** A circle-then-checkmark draw-on animation, the way Razorpay/Google Pay
 *  confirm a completed payment. Plays once on mount. */
export function SuccessCheck({ size = 64 }: SuccessCheckProps) {
  return (
    <div className={styles.wrap} role="img" aria-label="Success">
      <svg className={styles.svg} width={size} height={size} viewBox="0 0 52 52">
        <circle className={styles.circle} cx="26" cy="26" r="23" />
        <path className={styles.check} d="M15 27l7 7 16-16" />
      </svg>
    </div>
  );
}

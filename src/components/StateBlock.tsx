import type { ReactNode } from "react";
import { LogoMark } from "./LogoMark";
import { Button } from "./Button";
import { Icon } from "./Icon";
import styles from "./StateBlock.module.css";

interface StateBlockProps {
  title: string;
  children?: ReactNode;
  onRetry?: () => void;
  tone?: "quiet" | "error";
}

export function StateBlock({ title, children, onRetry, tone = "quiet" }: StateBlockProps) {
  return (
    <div className={styles.block} data-tone={tone}>
      <span className={styles.icon}>
        <LogoMark size={26} />
      </span>
      <p className={styles.title}>{title}</p>
      {children ? <p className={styles.body}>{children}</p> : null}
      {onRetry ? (
        <Button size="sm" onClick={onRetry}>
          <Icon name="refresh" size={15} />
          Try again
        </Button>
      ) : null}
    </div>
  );
}

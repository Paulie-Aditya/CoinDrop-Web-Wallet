import { useState } from "react";
import styles from "./Avatar.module.css";

interface AvatarProps {
  username: string;
  src?: string | null;
  size?: number;
}

export function Avatar({ username, src, size = 30 }: AvatarProps) {
  const [broken, setBroken] = useState(false);
  const initial = username.trim().charAt(0).toUpperCase() || "?";

  if (src && !broken) {
    return (
      <img
        className={styles.avatar}
        style={{ width: size, height: size }}
        src={src}
        alt=""
        onError={() => setBroken(true)}
      />
    );
  }

  return (
    <span
      className={styles.fallback}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}

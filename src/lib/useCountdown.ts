import { useEffect, useState } from "react";

/** Seconds remaining until `expiresAt` (a Date.now()-style timestamp), ticking
 *  every second. Used for the 30-second quote windows on withdraw and send. */
export function useCountdown(expiresAt: number | null): number {
  const [remaining, setRemaining] = useState(() =>
    expiresAt ? Math.max(0, Math.round((expiresAt - Date.now()) / 1000)) : 0,
  );

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => setRemaining(Math.max(0, Math.round((expiresAt - Date.now()) / 1000)));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  return remaining;
}

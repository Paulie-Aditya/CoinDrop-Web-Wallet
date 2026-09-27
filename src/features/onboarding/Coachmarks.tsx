import { useLayoutEffect, useState } from "react";
import styles from "./Coachmarks.module.css";

export interface CoachmarkStep {
  /** matches a `data-coachmark="<target>"` attribute somewhere on the page */
  target: string;
  title: string;
  body: string;
}

interface CoachmarksProps {
  steps: CoachmarkStep[];
  /** localStorage key — bump the suffix if the tour changes enough to re-show it */
  storageKey: string;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const TOOLTIP_WIDTH = 300;
const PADDING = 8;

function seen(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function markSeen(key: string): void {
  try {
    localStorage.setItem(key, "1");
  } catch {
    /* private browsing, storage disabled, etc. — just won't persist */
  }
}

export function Coachmarks({ steps, storageKey }: CoachmarksProps) {
  const [active, setActive] = useState(() => !seen(storageKey));
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  const step = steps[stepIndex];

  useLayoutEffect(() => {
    if (!active) return;

    function update() {
      const el = document.querySelector(`[data-coachmark="${step.target}"]`);
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    }

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      document.body.style.overflow = "";
    };
  }, [active, step]);

  function finish() {
    markSeen(storageKey);
    setActive(false);
  }

  function next() {
    if (stepIndex >= steps.length - 1) finish();
    else setStepIndex((i) => i + 1);
  }

  if (!active || !rect) return null;

  const highlight = {
    top: rect.top - PADDING,
    left: rect.left - PADDING,
    width: rect.width + PADDING * 2,
    height: rect.height + PADDING * 2,
  };

  const spaceBelow = window.innerHeight - (highlight.top + highlight.height);
  const above = spaceBelow < 200 && highlight.top > 200;
  const left = Math.min(
    Math.max(highlight.left, 16),
    window.innerWidth - TOOLTIP_WIDTH - 16,
  );

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Wallet tour">
      <div className={styles.highlight} style={highlight} />
      <div
        className={styles.tooltip}
        style={{
          top: above ? highlight.top - 12 : highlight.top + highlight.height + 12,
          left,
          transform: above ? "translateY(-100%)" : undefined,
        }}
      >
        <p className={styles.eyebrow}>
          {stepIndex + 1} of {steps.length}
        </p>
        <p className={styles.title}>{step.title}</p>
        <p className={styles.body}>{step.body}</p>
        <div className={styles.actions}>
          <button type="button" className="btn btn--ghost btn--sm" onClick={finish}>
            Skip
          </button>
          <div className={styles.navButtons}>
            {stepIndex > 0 && (
              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={() => setStepIndex((i) => i - 1)}
              >
                Back
              </button>
            )}
            <button type="button" className="btn btn--primary btn--sm" onClick={next}>
              {stepIndex >= steps.length - 1 ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

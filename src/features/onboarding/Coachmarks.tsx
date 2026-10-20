import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
const GAP = 12;
const EDGE = 16;

// fallback for when localStorage throws (storage blocked in Brave/Safari,
// some private modes) — without it the tour came back on every page load
const seenInMemory = new Set<string>();

function seen(key: string): boolean {
  if (seenInMemory.has(key)) return true;
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function markSeen(key: string): void {
  seenInMemory.add(key);
  try {
    localStorage.setItem(key, "1");
  } catch {
    /* private browsing, storage disabled, etc. — just won't persist */
  }
}

/** the step's element, or null if it isn't on the page or isn't visible (e.g. display: none at this width) */
function findTarget(target: string): Element | null {
  const el = document.querySelector(`[data-coachmark="${target}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 ? el : null;
}

export function Coachmarks({ steps, storageKey }: CoachmarksProps) {
  const [active, setActive] = useState(() => !seen(storageKey));
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [tooltipHeight, setTooltipHeight] = useState(0);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);

  const step = steps[stepIndex];

  function finish() {
    markSeen(storageKey);
    setActive(false);
  }

  /** index of the next step (in `delta` direction) whose target is actually visible, or -1 */
  function nextVisible(from: number, delta: 1 | -1): number {
    for (let i = from; i >= 0 && i < steps.length; i += delta) {
      if (findTarget(steps[i].target)) return i;
    }
    return -1;
  }

  function next() {
    const i = nextVisible(stepIndex + 1, 1);
    if (i === -1) finish();
    else setStepIndex(i);
  }

  function back() {
    const i = nextVisible(stepIndex - 1, -1);
    if (i !== -1) setStepIndex(i);
  }

  useLayoutEffect(() => {
    if (!active) return;

    const el = findTarget(step.target);
    if (!el) {
      // a missing target used to leave the tour "active" but invisible, with
      // page scroll still locked — skip past it instead
      setRect(null);
      const i = nextVisible(stepIndex + 1, 1);
      if (i === -1) finish();
      else setStepIndex(i);
      return;
    }

    // bring the target on screen; one taller than the viewport (the balances
    // card with a long coin list) is aligned to its top instead
    const fits = el.getBoundingClientRect().height <= window.innerHeight - EDGE * 2;
    el.scrollIntoView({ block: fits ? "center" : "start", inline: "nearest" });

    function update() {
      const r = el!.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    }
    update();

    // page scroll is deliberately not locked: doing so is what froze the page
    // when the target ran past the bottom of the screen and took the tooltip
    // (and its Skip button) with it
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    // the target's own box can change size after this first measurement —
    // a web font swapping in, or the balances list finishing loading — and
    // neither a window resize nor a scroll event fires for that
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(el);
    resizeObserver.observe(document.body);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      resizeObserver.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, step, stepIndex]);

  useLayoutEffect(() => {
    if (tooltipRef.current) setTooltipHeight(tooltipRef.current.offsetHeight);
  }, [rect, stepIndex]);

  const shown = active && rect !== null;

  useEffect(() => {
    if (shown) primaryRef.current?.focus({ preventScroll: true });
  }, [shown, stepIndex]);

  useEffect(() => {
    if (!active) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") finish();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  if (!shown) return null;

  const highlight = {
    top: rect.top - PADDING,
    left: rect.left - PADDING,
    width: rect.width + PADDING * 2,
    height: rect.height + PADDING * 2,
  };

  // below the target if it fits, else above, else pinned to the bottom of the
  // viewport over the target — the tooltip must always be fully on screen
  const vh = window.innerHeight;
  const below = highlight.top + highlight.height + GAP;
  const above = highlight.top - GAP - tooltipHeight;
  let top: number;
  if (below + tooltipHeight <= vh - EDGE) top = below;
  else if (above >= EDGE) top = above;
  else top = vh - tooltipHeight - EDGE;
  top = Math.max(EDGE, top);

  const left = Math.max(
    EDGE,
    Math.min(highlight.left, window.innerWidth - TOOLTIP_WIDTH - EDGE),
  );

  return (
    <div className={styles.overlay} role="dialog" aria-label="Wallet tour">
      {/* clicking the dimmed page dismisses the tour rather than silently
          swallowing the click */}
      <div className={styles.backdrop} onClick={finish} aria-hidden="true" />
      <div className={styles.highlight} style={highlight} />
      <div ref={tooltipRef} className={styles.tooltip} style={{ top, left }}>
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
              <button type="button" className="btn btn--outline btn--sm" onClick={back}>
                Back
              </button>
            )}
            <button
              ref={primaryRef}
              type="button"
              className="btn btn--primary btn--sm"
              onClick={next}
            >
              {stepIndex >= steps.length - 1 ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

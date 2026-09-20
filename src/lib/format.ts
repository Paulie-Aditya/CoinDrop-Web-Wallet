/** Formatting helpers. Ledger amounts are smallest-unit integers that can
 *  exceed Number.MAX_SAFE_INTEGER, so unit conversion goes through BigInt. */

/** "12345678", 8 -> "0.12345678" (trailing zeros trimmed, min 2 dp kept). */
export function formatUnits(amount: string, decimals: number): string {
  let negative = false;
  let digits = amount.trim();
  if (digits.startsWith("-")) {
    negative = true;
    digits = digits.slice(1);
  }
  if (!/^\d+$/.test(digits)) return "0";

  const padded = digits.padStart(decimals + 1, "0");
  const whole = padded.slice(0, padded.length - decimals);
  let frac = decimals > 0 ? padded.slice(padded.length - decimals) : "";

  // keep at most 8 significant fractional digits, trim trailing zeros
  frac = frac.slice(0, 8).replace(/0+$/, "");

  const wholeGrouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const body = frac ? `${wholeGrouped}.${frac}` : wholeGrouped;
  return negative && body !== "0" ? `-${body}` : body;
}

/** Full-precision decimal string, no grouping/truncation — for form inputs
 *  (e.g. a "Max" fill button), never for display. */
export function formatUnitsPlain(amount: string, decimals: number): string {
  let negative = false;
  let digits = amount.trim();
  if (digits.startsWith("-")) {
    negative = true;
    digits = digits.slice(1);
  }
  if (!/^\d+$/.test(digits)) return "0";

  const padded = digits.padStart(decimals + 1, "0");
  const whole = padded.slice(0, padded.length - decimals);
  const frac = decimals > 0 ? padded.slice(padded.length - decimals).replace(/0+$/, "") : "";
  const body = frac ? `${whole}.${frac}` : whole;
  return negative && body !== "0" ? `-${body}` : body;
}

/** Inverse of formatUnits(Plain): "0.5", 8 -> "50000000" (smallest-unit integer string). */
export function parseUnits(display: string, decimals: number): string {
  const trimmed = display.trim();
  if (!trimmed) return "0";
  const negative = trimmed.startsWith("-");
  const unsigned = negative ? trimmed.slice(1) : trimmed;
  const [wholeRaw = "", fracRaw = ""] = unsigned.split(".");
  const whole = wholeRaw.replace(/\D/g, "") || "0";
  const frac = fracRaw.replace(/\D/g, "").slice(0, decimals).padEnd(decimals, "0");
  const digits = (whole + frac).replace(/^0+(?=\d)/, "") || "0";
  return negative && digits !== "0" ? `-${digits}` : digits;
}

const usdFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const usdSmallFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 6,
});

export function formatUsd(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "—";
  if (n !== 0 && Math.abs(n) < 0.01) return usdSmallFmt.format(n);
  return usdFmt.format(n);
}

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["week", 60 * 60 * 24 * 7],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
];

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffSec = Math.round((then - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 45) return "just now";
  for (const [unit, secs] of UNITS) {
    if (abs >= secs) return rtf.format(Math.round(diffSec / secs), unit);
  }
  return "just now";
}

const absFmt = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function absoluteTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : absFmt.format(d);
}

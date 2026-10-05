import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PageShell } from "../components/PageShell";
import { Icon } from "../components/Icon";
import { Button } from "../components/Button";
import { StateBlock } from "../components/StateBlock";
import { toApiError } from "../api/http";
import { parseUnits } from "../lib/format";
import { parseBulkSendCsv, type BulkSendParseError } from "../lib/parseBulkSendCsv";
import { downloadCsv } from "../lib/exportCsv";
import { useCurrency } from "../features/currency/CurrencyContext";
import { useBalances } from "../features/wallet/useBalances";
import { useSendConfirm, useSendEstimate } from "../features/wallet/useSend";
import styles from "./WalletActions.module.css";
import cardStyles from "../features/wallet/cards.module.css";

type Phase = "setup" | "resolving" | "review" | "sending" | "done";
type RowStatus = "pending" | "resolved" | "failed" | "sending" | "sent";

interface BatchRow {
  line: number;
  toPublicId: number;
  amountDisplay: string;
  status: RowStatus;
  toUsername?: string;
  toHandle?: string | null;
  usdValue?: string | null;
  error?: string;
}

const STATUS_LABEL: Record<RowStatus, string> = {
  pending: "Pending",
  resolved: "Ready",
  failed: "Failed",
  sending: "Sending…",
  sent: "Sent",
};

const STATUS_COLOR: Record<RowStatus, string> = {
  pending: "var(--ink-300)",
  resolved: "var(--gold)",
  failed: "var(--neg)",
  sending: "var(--gold)",
  sent: "var(--pos)",
};

export function BulkSend() {
  const { money } = useCurrency();
  const balances = useBalances();
  const holdings = (balances.data?.balances ?? []).filter((b) => /[1-9]/.test(b.amount));

  const [symbol, setSymbol] = useState("");
  const activeSymbol = symbol || holdings[0]?.symbol || "";
  const selected = holdings.find((b) => b.symbol === activeSymbol);

  const [phase, setPhase] = useState<Phase>("setup");
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseErrors, setParseErrors] = useState<BulkSendParseError[]>([]);
  const [rows, setRows] = useState<BatchRow[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const estimateMutation = useSendEstimate();
  const confirmMutation = useSendConfirm();

  function patchRow(line: number, patch: Partial<BatchRow>) {
    setRows((prev) => prev.map((r) => (r.line === line ? { ...r, ...patch } : r)));
  }

  function handleFile(file: File) {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const { rows: parsed, errors } = parseBulkSendCsv(String(reader.result ?? ""));
      setParseErrors(errors);
      setRows(
        parsed.map((r) => ({
          line: r.line,
          toPublicId: r.toPublicId,
          amountDisplay: r.amountDisplay,
          status: "pending",
        })),
      );
    };
    reader.readAsText(file);
  }

  function downloadExample() {
    downloadCsv(
      "coindrop-bulk-send-example.csv",
      ["CoinDrop ID", "Amount"],
      [
        [5, 1.5],
        [12, 0.25],
      ],
    );
  }

  function startOver() {
    setPhase("setup");
    setFileName(null);
    setParseErrors([]);
    setRows([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function resolveAll() {
    if (!selected) return;
    setPhase("resolving");
    for (const row of rows) {
      try {
        const data = await estimateMutation.mutateAsync({
          toPublicId: row.toPublicId,
          symbol: activeSymbol,
          amount: parseUnits(row.amountDisplay, selected.decimals),
        });
        patchRow(row.line, {
          status: "resolved",
          toUsername: data.toUsername,
          toHandle: data.toHandle,
          usdValue: data.usdValue,
        });
      } catch (err) {
        patchRow(row.line, { status: "failed", error: toApiError(err).message });
      }
    }
    setPhase("review");
  }

  async function sendAll() {
    if (!selected) return;
    setPhase("sending");
    const toSend = rows.filter((r) => r.status === "resolved");
    for (const row of toSend) {
      patchRow(row.line, { status: "sending" });
      try {
        // the phase-1 token is long expired by now (review takes as long as
        // it takes) — get a fresh one right before actually sending
        const est = await estimateMutation.mutateAsync({
          toPublicId: row.toPublicId,
          symbol: activeSymbol,
          amount: parseUnits(row.amountDisplay, selected.decimals),
        });
        await confirmMutation.mutateAsync(est.token);
        patchRow(row.line, { status: "sent" });
      } catch (err) {
        patchRow(row.line, { status: "failed", error: toApiError(err).message });
      }
    }
    setPhase("done");
  }

  const readyRows = rows.filter((r) => r.status === "resolved" || r.status === "sent");
  const resolvedCount = rows.filter((r) => r.status === "resolved").length;
  const failedCount = rows.filter((r) => r.status === "failed").length;
  const sentCount = rows.filter((r) => r.status === "sent").length;
  const totalAmount = readyRows.reduce((sum, r) => sum + Number(r.amountDisplay), 0);
  const totalUsd = readyRows.reduce((sum, r) => sum + Number(r.usdValue ?? 0), 0);

  return (
    <PageShell>
      <Link to="/wallet/send" className={styles.back}>
        <Icon name="arrowLeft" size={15} />
        Back to Send
      </Link>

      <h1 className={styles.title}>Bulk send</h1>
      <p className={styles.lede}>
        Upload a CSV with a CoinDrop ID and an amount per row to send to many people at
        once, all in the same coin.
      </p>

      {balances.isPending ? null : holdings.length === 0 ? (
        <section className={`panel ${styles.card}`}>
          <StateBlock title="Nothing to send">
            Get tipped in Discord or Telegram, then come back here.
          </StateBlock>
        </section>
      ) : phase === "setup" ? (
        <section className={`panel ${styles.card}`}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="bulk-symbol">
              Coin
            </label>
            <select
              id="bulk-symbol"
              className={styles.select}
              value={activeSymbol}
              onChange={(e) => setSymbol(e.target.value)}
            >
              {holdings.map((b) => (
                <option key={b.symbol} value={b.symbol}>
                  {b.symbol}
                </option>
              ))}
            </select>
            <span className={styles.hint}>Every row in the sheet sends this coin.</span>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>CSV file</label>
            <div className={styles.row}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
              <Button type="button" onClick={() => fileInputRef.current?.click()}>
                <Icon name="upload" size={15} />
                {fileName ? "Choose a different file" : "Choose CSV file"}
              </Button>
              {fileName && <span className={styles.hint}>{fileName}</span>}
            </div>
            <span className={styles.hint}>
              Two columns, header optional:{" "}
              <button
                type="button"
                onClick={downloadExample}
                style={{
                  font: "inherit",
                  color: "inherit",
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
              >
                download an example
              </button>
              .
            </span>
          </div>

          {parseErrors.length > 0 && (
            <div className={styles.warning}>
              <Icon name="alertTriangle" size={18} />
              <div>
                <p className={styles.warningTitle}>
                  {parseErrors.length} row{parseErrors.length === 1 ? "" : "s"} couldn't be
                  read
                </p>
                <p className={styles.warningBody}>
                  {parseErrors
                    .slice(0, 5)
                    .map((e) => `Line ${e.line}: ${e.message}`)
                    .join(" · ")}
                  {parseErrors.length > 5 ? ` · +${parseErrors.length - 5} more` : ""}
                </p>
              </div>
            </div>
          )}

          {rows.length > 0 && (
            <p className={styles.hint}>
              {rows.length} valid row{rows.length === 1 ? "" : "s"} parsed.
            </p>
          )}

          <div className={styles.actions}>
            <Button
              type="button"
              variant="primary"
              onClick={() => void resolveAll()}
              disabled={rows.length === 0}
            >
              Look up recipients
            </Button>
          </div>
        </section>
      ) : (
        <section className={`panel ${styles.card}`}>
          <p className="eyebrow">
            {phase === "resolving"
              ? "Looking up recipients…"
              : phase === "review"
                ? "Review before sending"
                : phase === "sending"
                  ? "Sending…"
                  : "Done"}
          </p>

          {(phase === "review" || phase === "done") && (
            <p className={styles.lede} style={{ marginTop: "0.5rem" }}>
              {phase === "review" ? (
                <>
                  {resolvedCount} of {rows.length} ready to send, totaling{" "}
                  {totalAmount.toLocaleString(undefined, { maximumFractionDigits: 8 })}{" "}
                  {activeSymbol}
                  {totalUsd > 0 && <> (~{money(totalUsd)})</>}.
                  {failedCount > 0 && ` ${failedCount} couldn't be resolved and will be skipped.`}
                </>
              ) : (
                <>
                  {sentCount} of {readyRows.length} sent successfully.
                  {failedCount > 0 && ` ${failedCount} failed.`}
                </>
              )}
            </p>
          )}

          <ul className={cardStyles.rows} style={{ marginTop: "0.75rem" }}>
            {rows.map((r) => (
              <li key={r.line} className={cardStyles.row}>
                <span className={cardStyles.rowMain}>
                  <span className={cardStyles.rowTitle}>
                    {r.toUsername ?? `CoinDrop ID ${r.toPublicId}`}
                    {r.toHandle ? ` (${r.toHandle})` : ""}
                  </span>
                  <span className={cardStyles.rowMeta}>
                    {r.error ?? <span style={{ color: STATUS_COLOR[r.status] }}>
                      {STATUS_LABEL[r.status]}
                    </span>}
                  </span>
                </span>
                <span className={cardStyles.rowAmount}>
                  <span className="mono">
                    {r.amountDisplay} {activeSymbol}
                  </span>
                  {r.usdValue && (
                    <span className={`${cardStyles.rowMeta} mono`}>{money(r.usdValue)}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>

          <div className={styles.actions} style={{ marginTop: "1rem" }}>
            {phase === "review" && (
              <>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => void sendAll()}
                  disabled={resolvedCount === 0}
                >
                  Send to {resolvedCount} {resolvedCount === 1 ? "person" : "people"}
                </Button>
                <Button type="button" variant="outline" onClick={startOver}>
                  Start over
                </Button>
              </>
            )}
            {phase === "done" && (
              <>
                <Link to="/wallet" className="btn btn--primary">
                  Back to wallet
                </Link>
                <Button type="button" variant="outline" onClick={startOver}>
                  Send another batch
                </Button>
              </>
            )}
          </div>
        </section>
      )}
    </PageShell>
  );
}

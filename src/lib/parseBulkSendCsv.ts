export interface BulkSendRow {
  /** 1-indexed line number, for error messages */
  line: number;
  toPublicId: number;
  /** raw decimal string as typed in the sheet, e.g. "1.5" — not yet smallest-unit */
  amountDisplay: string;
}

export interface BulkSendParseError {
  line: number;
  message: string;
}

export interface ParsedBulkSendCsv {
  rows: BulkSendRow[];
  errors: BulkSendParseError[];
}

function splitCsvLine(line: string): string[] {
  return line.split(",").map((cell) => cell.trim().replace(/^"(.*)"$/, "$1"));
}

/** Two columns: CoinDrop ID, Amount. An optional header row is skipped only
 *  when NEITHER column on line 1 parses as a number, so a genuine typo in a
 *  headerless sheet's first data row still surfaces as an error. */
export function parseBulkSendCsv(text: string): ParsedBulkSendCsv {
  const rows: BulkSendRow[] = [];
  const errors: BulkSendParseError[] = [];

  const lines = text
    .split(/\r\n|\r|\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  lines.forEach((line, i) => {
    const lineNo = i + 1;
    const cells = splitCsvLine(line);
    if (cells.length < 2) {
      errors.push({ line: lineNo, message: "Expected two columns: CoinDrop ID, Amount" });
      return;
    }
    const [idRaw, amountRaw] = cells;
    const idIsNumeric = /^\d+$/.test(idRaw);
    const amountIsNumeric = /^\d*\.?\d+$/.test(amountRaw);

    if (lineNo === 1 && !idIsNumeric && !amountIsNumeric) return; // header row

    if (!idIsNumeric || Number(idRaw) <= 0) {
      errors.push({ line: lineNo, message: `"${idRaw}" isn't a valid CoinDrop ID` });
      return;
    }
    if (!amountIsNumeric || Number(amountRaw) <= 0) {
      errors.push({ line: lineNo, message: `"${amountRaw}" isn't a valid amount` });
      return;
    }

    rows.push({ line: lineNo, toPublicId: Number(idRaw), amountDisplay: amountRaw });
  });

  return { rows, errors };
}

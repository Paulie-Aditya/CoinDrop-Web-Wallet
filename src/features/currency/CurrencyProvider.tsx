import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchRates } from "../../api/rates";
import { formatMoney, formatUsd } from "../../lib/format";
import { CurrencyContext } from "./CurrencyContext";

const STORAGE_KEY = "coindrop.currency";

function loadStoredCode(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || "USD";
  } catch {
    return "USD";
  }
}

function storeCode(code: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    /* private browsing, storage disabled, etc. — just won't persist */
  }
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [code, setCodeState] = useState(loadStoredCode);

  // /rates isn't session-scoped and rarely changes — one shared cache, no
  // need to key by the selected code since we just fetch the whole table.
  const { data } = useQuery({
    queryKey: ["rates"],
    queryFn: () => fetchRates(),
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
  });

  const codes = useMemo(() => {
    const others = data ? Object.keys(data.rates).filter((c) => c !== "USD").sort() : [];
    return ["USD", ...others];
  }, [data]);

  function setCode(next: string) {
    setCodeState(next);
    storeCode(next);
  }

  function money(value: string | number | null | undefined): string {
    const rate = code !== "USD" ? data?.rates[code] : undefined;
    if (!rate) return formatUsd(value);
    if (value === null || value === undefined || value === "") return "—";
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n)) return "—";
    return formatMoney(n * Number(rate), code);
  }

  return (
    <CurrencyContext.Provider value={{ code, setCode, codes, money }}>
      {children}
    </CurrencyContext.Provider>
  );
}

import { createContext, useContext } from "react";

export interface CurrencyContextValue {
  code: string;
  setCode: (code: string) => void;
  /** every code the dropdown can offer — "USD" first, then whatever /rates knows about */
  codes: string[];
  /** format a USD decimal value (string/number from the backend) in the selected currency */
  money: (value: string | number | null | undefined) => string;
  /** the code money() actually formats in — "USD" when the selected code has no rate yet */
  fiatCode: string;
  /** units of fiatCode per 1 USD (1 for USD) */
  fiatRate: number;
}

export const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within a CurrencyProvider");
  return ctx;
}

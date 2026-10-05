import { createContext, useContext } from "react";

export interface CurrencyContextValue {
  code: string;
  setCode: (code: string) => void;
  /** every code the dropdown can offer — "USD" first, then whatever /rates knows about */
  codes: string[];
  /** format a USD decimal value (string/number from the backend) in the selected currency */
  money: (value: string | number | null | undefined) => string;
}

export const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within a CurrencyProvider");
  return ctx;
}

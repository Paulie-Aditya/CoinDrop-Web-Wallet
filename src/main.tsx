import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { Analytics } from "@vercel/analytics/react";
import { queryClient } from "./lib/queryClient";
import { CurrencyProvider } from "./features/currency/CurrencyProvider";
import { App } from "./app/App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <CurrencyProvider>
        <App />
      </CurrencyProvider>
      <Analytics />
    </QueryClientProvider>
  </StrictMode>,
);

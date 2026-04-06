import React from "react";
import ReactDOM from "react-dom/client";
import { AppRouter } from "./routes/router";
import { QueryProvider } from "./providers/QueryProvider";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryProvider>
      <AppRouter />
    </QueryProvider>
  </React.StrictMode>,
);

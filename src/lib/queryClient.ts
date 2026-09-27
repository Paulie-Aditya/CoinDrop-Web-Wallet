import { QueryClient } from "@tanstack/react-query";
import { isUnauthenticated } from "../api/http";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (isUnauthenticated(error)) return false;
        return failureCount < 2;
      },
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Default "online" mode pauses queries (fetchStatus: "paused") whenever
      // TanStack's own online/offline heuristic thinks the browser is
      // offline — and if that heuristic ever gets stuck (observed live: a
      // dispatched `online` event didn't unstick it), the query just spins
      // forever with no error, indistinguishable from a hung backend. Axios
      // already surfaces real connectivity failures as rejected promises, so
      // this extra gating only adds a failure mode, never a benefit here.
      networkMode: "always",
    },
    mutations: {
      networkMode: "always",
    },
  },
});

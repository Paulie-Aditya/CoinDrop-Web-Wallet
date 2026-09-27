import { useMutation, useQuery } from "@tanstack/react-query";
import { confirmWithdrawal, estimateWithdrawal, fetchWithdrawStatus } from "../../api/wallet";
import { queryClient } from "../../lib/queryClient";
import type { WithdrawEstimateInput, WithdrawStatusValue } from "../../api/types";

export function useWithdrawEstimate() {
  return useMutation({
    mutationFn: (input: WithdrawEstimateInput) => estimateWithdrawal(input),
  });
}

export function useWithdrawConfirm() {
  return useMutation({
    mutationFn: (token: string) => confirmWithdrawal(token),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["wallet", "balances"] });
      void queryClient.invalidateQueries({ queryKey: ["wallet", "transactions"] });
    },
  });
}

const TERMINAL_STATUSES = new Set<WithdrawStatusValue>(["done", "failed"]);

export function useWithdrawStatus(id: string | null) {
  return useQuery({
    queryKey: ["wallet", "withdraw", "status", id],
    queryFn: () => fetchWithdrawStatus(id as string),
    enabled: !!id,
    retry: false,
    // keep polling while it's in flight; stop once it lands on a terminal status
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && TERMINAL_STATUSES.has(status) ? false : 4000;
    },
  });
}

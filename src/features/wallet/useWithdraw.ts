import { useMutation } from "@tanstack/react-query";
import { confirmWithdrawal, estimateWithdrawal } from "../../api/wallet";
import { queryClient } from "../../lib/queryClient";
import type { WithdrawEstimateInput } from "../../api/types";

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

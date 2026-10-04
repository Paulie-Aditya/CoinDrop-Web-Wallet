import { useMutation } from "@tanstack/react-query";
import { confirmSend, estimateSend } from "../../api/wallet";
import { queryClient } from "../../lib/queryClient";
import type { SendEstimateInput } from "../../api/types";

export function useSendEstimate() {
  return useMutation({
    mutationFn: (input: SendEstimateInput) => estimateSend(input),
  });
}

export function useSendConfirm() {
  return useMutation({
    mutationFn: (token: string) => confirmSend(token),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["wallet", "balances"] });
      void queryClient.invalidateQueries({ queryKey: ["wallet", "transactions"] });
    },
  });
}

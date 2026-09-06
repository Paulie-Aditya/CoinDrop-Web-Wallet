import { useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { CoinLoader } from "../components/CoinLoader";
import { StateBlock } from "../components/StateBlock";
import { Button } from "../components/Button";
import { useSession, sessionKey } from "../features/auth/useSession";

export function AuthCallback() {
  const [params] = useSearchParams();
  const queryClient = useQueryClient();
  const providerError = params.get("error");
  const from = params.get("from");

  const { isPending, isAuthenticated, unauthenticated, error, refetch } = useSession();

  useEffect(() => {
    // The cookie is set by now; make sure we're not reading a stale 401.
    void queryClient.invalidateQueries({ queryKey: sessionKey });
  }, [queryClient]);

  if (providerError) {
    return (
      <StateBlock tone="error" title="Sign-in was cancelled">
        Nothing was changed. <a href="/login">Back to login</a>.
      </StateBlock>
    );
  }

  if (isPending) return <CoinLoader label="Finishing sign-in" />;

  if (isAuthenticated) return <Navigate to={from || "/wallet"} replace />;

  if (unauthenticated) {
    return (
      <StateBlock tone="error" title="That didn't go through">
        We couldn't confirm your session. <a href="/login">Try logging in again</a>.
      </StateBlock>
    );
  }

  return (
    <StateBlock tone="error" title="Couldn't reach CoinDrop">
      {error?.message ?? "Something went wrong."}
      <br />
      <Button size="sm" onClick={() => void refetch()}>
        Retry
      </Button>
    </StateBlock>
  );
}

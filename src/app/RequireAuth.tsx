import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "../features/auth/useSession";
import { CoinLoader } from "../components/CoinLoader";
import { StateBlock } from "../components/StateBlock";

export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { isPending, isAuthenticated, unauthenticated, error, refetch } = useSession();

  if (isPending) return <CoinLoader label="Checking your session" />;

  if (error) {
    return (
      <StateBlock
        tone="error"
        title="Couldn't reach CoinDrop"
        onRetry={() => void refetch()}
      >
        Check your connection and try again.
      </StateBlock>
    );
  }

  if (unauthenticated || !isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

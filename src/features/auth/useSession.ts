import { useQuery } from "@tanstack/react-query";
import { fetchSession } from "../../api/auth";
import { isUnauthenticated } from "../../api/http";

export const sessionKey = ["session"] as const;

export function useSession() {
  const query = useQuery({
    queryKey: sessionKey,
    queryFn: fetchSession,
    retry: false,
    staleTime: 5 * 60_000,
  });

  const unauthenticated = isUnauthenticated(query.error);

  return {
    user: query.data ?? null,
    isPending: query.isPending,
    isAuthenticated: !!query.data,
    /** a real 401 vs. a network/server error we couldn't classify */
    unauthenticated,
    error: query.error && !unauthenticated ? query.error : null,
    refetch: query.refetch,
  };
}

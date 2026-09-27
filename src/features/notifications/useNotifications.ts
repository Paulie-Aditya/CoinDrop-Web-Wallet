import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { fetchNotifications, markNotificationSeen } from "../../api/notifications";
import { queryClient } from "../../lib/queryClient";

const unseenCountKey = ["notifications", "unseenCount"] as const;
const listKey = ["notifications", "list"] as const;

/** Cheap poll for just the bell badge — never fetches the full list. */
export function useUnseenCount() {
  return useQuery({
    queryKey: unseenCountKey,
    queryFn: () => fetchNotifications({ unseenOnly: true, limit: 1 }),
    select: (data) => data.unseenCount,
    refetchInterval: 20_000,
  });
}

/** Full list, only fetched while the panel is actually open. */
export function useNotificationsList(enabled: boolean) {
  return useInfiniteQuery({
    queryKey: listKey,
    queryFn: ({ pageParam }) => fetchNotifications({ cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    enabled,
  });
}

export function useMarkNotificationSeen() {
  return useMutation({
    mutationFn: (id: number) => markNotificationSeen(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

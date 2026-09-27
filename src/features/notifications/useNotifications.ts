import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { fetchNotifications, markNotificationSeen } from "../../api/notifications";
import { queryClient } from "../../lib/queryClient";

export const notificationsKey = ["notifications"] as const;

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: notificationsKey,
    queryFn: ({ pageParam }) => fetchNotifications(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    // light polling so the bell badge updates without a manual refresh
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationSeen() {
  return useMutation({
    mutationFn: (id: string) => markNotificationSeen(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationsKey });
    },
  });
}

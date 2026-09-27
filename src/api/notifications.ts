import { http } from "./http";
import type { NotificationsResponse } from "./types";

export interface NotificationsQuery {
  cursor?: string | null;
  /** cheap poll for just the badge count — skips fetching full rows */
  unseenOnly?: boolean;
  limit?: number;
}

export async function fetchNotifications(
  query: NotificationsQuery = {},
): Promise<NotificationsResponse> {
  const params: Record<string, string> = {};
  if (query.cursor) params.cursor = query.cursor;
  if (query.unseenOnly) params.unseenOnly = "1";
  if (query.limit) params.limit = String(query.limit);
  const { data } = await http.get<NotificationsResponse>("/wallet/notifications", { params });
  return data;
}

export async function markNotificationSeen(id: number): Promise<void> {
  await http.post(`/wallet/notifications/${id}/seen`);
}

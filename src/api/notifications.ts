import { http } from "./http";
import type { NotificationsResponse } from "./types";

export async function fetchNotifications(cursor: string | null): Promise<NotificationsResponse> {
  const params: Record<string, string> = {};
  if (cursor) params.cursor = cursor;
  const { data } = await http.get<NotificationsResponse>("/wallet/notifications", { params });
  return data;
}

export async function markNotificationSeen(id: string): Promise<void> {
  await http.post(`/wallet/notifications/${encodeURIComponent(id)}/seen`);
}

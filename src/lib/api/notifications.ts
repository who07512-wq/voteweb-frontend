import { api } from "./client";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  timestamp: string;
}

export const notificationApi = {
  getAll: () => api.get<Notification[]>("/notifications"),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`, {}),
  markAllRead: () => api.patch("/notifications/read-all", {}),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

import { api } from "./client";

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  enrollmentNumber: string;
  department: string;
  year: string;
  section: string;
  phone: string;
  avatar: string | null;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  voteReminders: boolean;
  resultAnnouncements: boolean;
  systemUpdates: boolean;
}

export interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  ip: string;
  lastActive: string;
  current: boolean;
}

export const studentApi = {
  getProfile: () => api.get<StudentProfile>("/students/profile"),
  updateProfile: (data: Partial<StudentProfile>) => api.put<StudentProfile>("/students/profile", data),
  getNotificationSettings: () => api.get<NotificationSettings>("/students/notifications/settings"),
  updateNotificationSettings: (data: Partial<NotificationSettings>) => api.put("/students/notifications/settings", data),
  getActiveSessions: () => api.get<ActiveSession[]>("/students/sessions"),
  deleteSession: (id: string) => api.delete(`/students/sessions/${id}`),
};

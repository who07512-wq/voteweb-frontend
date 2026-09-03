import { api } from "./client";

export interface AdminElection {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  eligibleStudents: number;
  totalPositions: number;
  participation: number;
}

export interface AdminStudent {
  id: string;
  name: string;
  email: string;
  department: string;
  year: string;
  section: string;
  hasVoted: boolean;
  status: string;
}

export interface ScheduleEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: string;
  status: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: string;
  status: string;
}

export interface AdminIssue {
  id: string;
  title: string;
  category: string;
  reportedBy: string;
  date: string;
  status: string;
  priority: string;
}

export interface ActivityLogEntry {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details: string;
}

export const adminApi = {
  getElection: () => api.get<AdminElection>("/admin/election"),
  updateElection: (data: Partial<AdminElection>) => api.put("/admin/election", data),
  getStudents: () => api.get<AdminStudent[]>("/admin/students"),
  getSchedule: () => api.get<ScheduleEvent[]>("/admin/schedule"),
  addScheduleEvent: (data: Omit<ScheduleEvent, "id">) => api.post<ScheduleEvent>("/admin/schedule", data),
  deleteScheduleEvent: (id: string) => api.delete(`/admin/schedule/${id}`),
  getAnnouncements: () => api.get<Announcement[]>("/admin/announcements"),
  addAnnouncement: (data: Omit<Announcement, "id">) => api.post<Announcement>("/admin/announcements", data),
  deleteAnnouncement: (id: string) => api.delete(`/admin/announcements/${id}`),
  getIssues: () => api.get<AdminIssue[]>("/admin/issues"),
  updateIssue: (id: string, data: Partial<AdminIssue>) => api.patch(`/admin/issues/${id}`, data),
  getActivity: () => api.get<ActivityLogEntry[]>("/admin/activity"),
  getDashboard: () => api.get("/admin/dashboard"),
};

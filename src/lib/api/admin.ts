import { api } from "./client";

export interface AdminStats {
  students: { total: number; active: number; voting_eligible: number };
  elections: { total: number; open: number; published: number };
  candidates: { total: number };
  votes: { total: number; unique_voters: number };
  accessRequests: { total: number; pending: number };
  pendingCandidateApplications: number;
  generatedAt: string;
}

export interface AdminStudentRecord {
  id: number;
  student_id: string | null;
  name: string;
  email: string | null;
  role: string;
  is_active: boolean;
  voting_eligible?: boolean;
}

export interface AdminElectionRecord {
  id: number;
  name: string;
  status: string;
  start_time: string | null;
  end_time: string | null;
}

export interface AdminAnnouncementRecord {
  id: number;
  title: string;
  content: string;
  status: string;
  created_at: string;
}

export interface SupportRequestRecord {
  id: number;
  subject?: string;
  category?: string;
  message?: string;
  status?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface AuditLogRecord {
  id: number;
  action: string;
  user_name: string | null;
  user_role: string | null;
  ip_address: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

/**
 * All admin data access — REAL backend endpoints only (no mock data).
 * The api client handles cookies, CSRF tokens and session binding.
 */
export const adminApi = {
  // Real-time statistics (GET /admin/stats)
  getStats: () => api.get<AdminStats>("/admin/stats"),

  // Students (GET /admin/students)
  getStudents: () => api.get<{ students?: AdminStudentRecord[] } | AdminStudentRecord[]>("/admin/students"),

  // Update a student (PATCH /admin/students/:id) — voting eligibility + role management
  updateStudent: (id: number, patch: { voting_eligible?: boolean; role?: string; name?: string; email?: string | null }) =>
    api.patch<{ data: AdminStudentRecord }>(`/admin/students/${id}`, patch),

  // Elections (GET /admin/elections)
  getElections: () => api.get<{ elections?: AdminElectionRecord[] } | AdminElectionRecord[]>("/admin/elections"),

  // Announcements (GET /admin/announcements)
  getAnnouncements: () =>
    api.get<{ announcements?: AdminAnnouncementRecord[] } | AdminAnnouncementRecord[]>("/admin/announcements"),

  // Support issues (GET /admin/support — the backend does NOT serve /admin/issues)
  getIssues: () => api.get<{ requests?: SupportRequestRecord[] } | SupportRequestRecord[]>("/admin/support"),

  // Audit log (GET /admin/audit-logs)
  getAuditLogs: () => api.get<{ logs: AuditLogRecord[] }>("/admin/audit-logs"),

  // Student access requests
  getAccessRequests: (status?: string) =>
    api.get<{ requests: unknown[]; counts: Record<string, number> }>(
      `/admin/access-requests${status ? `?status=${status}` : ""}`
    ),

  // Live election results (same read-only results service CAD uses)
  getElectionResults: (electionId: number) => api.get(`/cad/elections/${electionId}/results`),
  getMonitorElections: () => api.get<{ elections: Array<{ id: number; name: string; status: string }> }>("/cad/elections"),

  // Announcements management (admin CRUD)
  createAnnouncement: (body: { title: string; message: string; audience: string; priority?: string; is_published: boolean; election_id?: number | null }) =>
    api.post("/admin/announcements", body),
  updateAnnouncement: (id: number | string, body: { title?: string; message?: string; audience?: string; priority?: string; is_published?: boolean }) =>
    api.patch(`/admin/announcements/${id}`, body),
  deleteAnnouncement: (id: number | string) => api.delete(`/admin/announcements/${id}`),

  // Support request management
  updateSupportRequest: (id: number | string, body: { status?: string; priority?: string; response?: string; assigned_to?: string | null }) =>
    api.patch(`/admin/support/${id}`, body),

  // Publish election results (real endpoint)
  publishElectionResults: (electionId: number | string) => api.post(`/admin/elections/${electionId}/publish`, {}),
};

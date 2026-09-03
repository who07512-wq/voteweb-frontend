import { api } from "./client";
import type { ApplicationStatus } from "../candidate-dashboard-data";

export interface CandidateApplication {
  id: string;
  name: string;
  enrollmentNumber: string;
  department: string;
  year: string;
  section: string;
  position: string;
  email: string;
  phone: string;
  photo: string | null;
  bio: string;
  manifesto: string;
  status: ApplicationStatus;
  rejectionReason: string | null;
  adminNote: string | null;
  submittedDate: string | null;
  reviewedDate: string | null;
}

export interface SubmitApplicationPayload {
  name: string;
  enrollmentNumber: string;
  department: string;
  year: string;
  section: string;
  position: string;
  email: string;
  phone: string;
  photo: string | null;
  bio: string;
  manifesto: string;
}

export interface UpdateStatusPayload {
  status: ApplicationStatus;
  reason?: string;
  note?: string;
}

export const candidateApi = {
  getApplication: (id: string) => api.get<CandidateApplication>(`/candidates/${id}`),
  getMyApplication: () => api.get<CandidateApplication>("/candidates/me"),
  getAll: () => api.get<CandidateApplication[]>("/candidates"),
  getApproved: () => api.get<CandidateApplication[]>("/candidates/approved"),
  submit: (data: SubmitApplicationPayload) => api.post<CandidateApplication>("/candidates", data),
  update: (id: string, data: Partial<SubmitApplicationPayload>) => api.put<CandidateApplication>(`/candidates/${id}`, data),
  updateStatus: (id: string, data: UpdateStatusPayload) => api.patch<CandidateApplication>(`/candidates/${id}/status`, data),
  getPositions: () => api.get<string[]>("/candidates/positions"),
  getDepartments: () => api.get<string[]>("/candidates/departments"),
};

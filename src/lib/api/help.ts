import { api } from "./client";

export interface SupportRequest {
  id: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  messages: SupportMessage[];
}

export interface SupportMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
  isAdmin: boolean;
}

export interface CreateSupportRequestPayload {
  subject: string;
  category: string;
  description: string;
  priority: string;
}

export const helpApi = {
  getRequests: () => api.get<SupportRequest[]>("/help/requests"),
  getRequest: (id: string) => api.get<SupportRequest>(`/help/requests/${id}`),
  createRequest: (data: CreateSupportRequestPayload) => api.post<SupportRequest>("/help/requests", data),
  addMessage: (id: string, message: string) => api.post(`/help/requests/${id}/messages`, { message }),
  getFAQ: () => api.get("/help/faq"),
  getSystemStatus: () => api.get("/help/status"),
};

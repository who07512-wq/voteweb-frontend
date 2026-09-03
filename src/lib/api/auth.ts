import { api } from "./client";

export interface LoginRequest {
  email: string;
  password: string;
  role: "student" | "candidate" | "administrator";
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    department?: string;
    year?: string;
  };
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ChangePasswordRequest {
  token: string;
  newPassword: string;
}

export const authApi = {
  login: (data: LoginRequest) => api.post<LoginResponse>("/auth/login", data),
  logout: () => api.post("/auth/logout", {}),
  getProfile: () => api.get<LoginResponse["user"]>("/auth/profile"),
  forgotPassword: (data: ResetPasswordRequest) => api.post("/auth/forgot-password", data),
  resetPassword: (data: ChangePasswordRequest) => api.post("/auth/reset-password", data),
};

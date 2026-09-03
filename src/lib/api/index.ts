export { api, ApiError } from "./client";
export { authApi } from "./auth";
export type { LoginRequest, LoginResponse, ResetPasswordRequest, ChangePasswordRequest } from "./auth";

export { candidateApi } from "./candidates";
export type { CandidateApplication, SubmitApplicationPayload, UpdateStatusPayload } from "./candidates";

export { electionApi } from "./elections";
export type { Election, ElectionPosition, ElectionCandidate, CastVotePayload, VoteResponse } from "./elections";

export { studentApi } from "./students";
export type { StudentProfile, NotificationSettings, ActiveSession } from "./students";

export { adminApi } from "./admin";
export type { AdminElection, AdminStudent, ScheduleEvent, Announcement, AdminIssue, ActivityLogEntry } from "./admin";

export { notificationApi } from "./notifications";
export type { Notification } from "./notifications";

export { receiptApi } from "./receipts";
export type { Receipt, ReceiptHistoryItem } from "./receipts";

export { resultsApi } from "./results";
export type { ElectionResults, PositionResult, CandidateResult, DepartmentParticipation } from "./results";

export { helpApi } from "./help";
export type { SupportRequest, SupportMessage, CreateSupportRequestPayload } from "./help";

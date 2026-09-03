export type NotificationType = "success" | "info" | "warning" | "error";
export type NotificationCategory = "voting" | "election" | "candidate" | "support" | "account" | "system" | "results";
export type NotificationPriority = "normal" | "important" | "action_required" | "critical";

export interface Notification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action?: { label: string; href: string };
}

export const MOCK_NOTIFICATIONS: Notification[] = [];

export const NOTIFICATION_CATEGORIES = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "election", label: "Election" },
  { value: "account", label: "Account" },
  { value: "support", label: "Support" },
  { value: "system", label: "System" },
  { value: "candidate", label: "Candidate" },
  { value: "results", label: "Results" },
];

export const SYSTEM_SERVICES = [
  { name: "Authentication", status: "operational" as const },
  { name: "Student Portal", status: "operational" as const },
  { name: "Candidate Portal", status: "operational" as const },
  { name: "Voting System", status: "operational" as const },
  { name: "Receipt Verification", status: "operational" as const },
  { name: "Results", status: "operational" as const },
  { name: "Notifications", status: "operational" as const },
];

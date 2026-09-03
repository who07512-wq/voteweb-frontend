export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "changes_requested"
  | "approved"
  | "rejected";

export interface ManifestoSection {
  id: string;
  title: string;
  content: string;
}

export interface CandidateNotification {
  id: string;
  type: "success" | "warning" | "info";
  title: string;
  message: string;
  date: string;
  read: boolean;
}

export interface StatusTimelineEvent {
  label: string;
  date: string | null;
  completed: boolean;
  current: boolean;
}

export interface MockCandidateProfile {
  id: string;
  name: string;
  enrollmentNumber: string;
  position: string;
  department: string;
  year: string;
  section: string;
  biography: string;
  campaignLogo: string | null;
  campaignTitle: string;
  campaignDescription: string;
  manifesto: ManifestoSection[];
  applicationStatus: ApplicationStatus;
  profileCompletion: number;
  registrationDate: string;
  electionName: string;
  votingPeriod: string;
  resultsDate: string;
  socialLinks: {
    email: string;
    phone: string;
  };
  profileViews: number;
  verificationBadge: boolean;
  adminNote: string | null;
}

export const MOCK_CANDIDATE_PROFILE: MockCandidateProfile = {
  id: "",
  name: "Candidate",
  enrollmentNumber: "",
  position: "",
  department: "",
  year: "",
  section: "",
  biography: "",
  campaignLogo: null,
  campaignTitle: "",
  campaignDescription: "",
  manifesto: [],
  applicationStatus: "draft",
  profileCompletion: 0,
  registrationDate: "",
  electionName: "Student Council Election 2026",
  votingPeriod: "1 August – 10 August 2026",
  resultsDate: "11 August 2026",
  socialLinks: {
    email: "",
    phone: "",
  },
  profileViews: 0,
  verificationBadge: false,
  adminNote: null,
};

export const MOCK_STATUS_TIMELINE: StatusTimelineEvent[] = [];

export const MOCK_CANDIDATE_NOTIFICATIONS: CandidateNotification[] = [];

export const PROFILE_CHECKLIST = [
  { label: "Candidate name", checked: false },
  { label: "Position", checked: false },
  { label: "Department", checked: false },
  { label: "Year", checked: false },
  { label: "Biography", checked: false },
  { label: "Campaign logo", checked: false },
  { label: "Manifesto", checked: false },
  { label: "Social links", checked: false },
];

export const ELECTION_INFO = {
  election: "Student Council Election 2026",
  position: "—",
  candidateId: "—",
  registration: "Open",
  voting: "Upcoming",
  results: "11 August 2026",
};

export const CANDIDATE_GUIDELINES = [
  "Provide accurate profile information.",
  "Follow election administration rules.",
  "Do not impersonate another candidate.",
  "Do not upload offensive content.",
  "Do not use misleading institutional branding.",
  "Do not attempt to manipulate voting systems.",
  "Follow campaign rules established by election administration.",
];

export const ISSUE_CATEGORIES_CANDIDATE = [
  "Profile not updating",
  "Campaign logo upload issue",
  "Manifesto saving error",
  "Application status question",
  "Account access issue",
  "Election规则 clarification",
  "Other",
];

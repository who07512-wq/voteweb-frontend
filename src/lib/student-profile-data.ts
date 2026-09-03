"use client";

// Mock student profile data for CampusVote Module 7

export interface StudentProfile {
  name: string;
  studentId: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  department: string;
  program: string;
  year: string;
  admissionYear: string;
  institution: string;
  accountStatus: string;
  electionEligible: boolean;
  electionName: string;
  electionStatus: string;
  initials: string;
}

export interface NotificationSettings {
  electionReminders: boolean;
  voteConfirmation: boolean;
  resultsPublished: boolean;
  systemAnnouncements: boolean;
  helpSupportUpdates: boolean;
}

export interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export const MOCK_STUDENT_PROFILE: StudentProfile = {
  name: "Anurag Gupta",
  studentId: "DBIT2025XXXX",
  email: "student@example.com",
  phone: "+91 XXXXX XXXXX",
  dateOfBirth: "Not displayed publicly",
  department: "Computer Applications",
  program: "BCA",
  year: "2nd Year",
  admissionYear: "2025",
  institution: "Don Bosco Institute of Technology",
  accountStatus: "Active",
  electionEligible: true,
  electionName: "Student Council Election 2026",
  electionStatus: "Voting Open",
  initials: "AG",
};

export const MOCK_NOTIFICATION_SETTINGS: NotificationSettings = {
  electionReminders: true,
  voteConfirmation: true,
  resultsPublished: true,
  systemAnnouncements: true,
  helpSupportUpdates: false,
};

export const MOCK_ACTIVE_SESSIONS: ActiveSession[] = [
  {
    id: "session-1",
    device: "Chrome on Windows",
    browser: "Chrome 120",
    location: "Delhi, India",
    lastActive: "Active now",
    isCurrent: true,
  },
  {
    id: "session-2",
    device: "Mobile Browser",
    browser: "Safari on iPhone",
    location: "Delhi, India",
    lastActive: "2 hours ago",
    isCurrent: false,
  },
];

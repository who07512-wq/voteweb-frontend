"use client";

// Mock help/support data for CampusVote Module 8

export type SupportStatus = "open" | "in_review" | "waiting" | "resolved" | "closed";

export interface SupportRequest {
  id: string;
  category: string;
  status: SupportStatus;
  submitted: string;
  description: string;
  receiptId?: string;
  response?: string;
  timeline: TimelineEvent[];
}

export interface TimelineEvent {
  date: string;
  description: string;
}

export const ISSUE_CATEGORIES = [
  "Login Problem",
  "Voting Problem",
  "Candidate Information",
  "Vote Receipt",
  "Technical Error",
  "Account Problem",
  "Other",
];

export const MOCK_SUPPORT_REQUESTS: SupportRequest[] = [
  {
    id: "SUP-2026-0042",
    category: "Technical Error",
    status: "open",
    submitted: "13 August 2026",
    description: "The voting page did not load correctly. I tried refreshing but the page kept showing a blank screen.",
    timeline: [
      { date: "13 August 2026, 2:15 PM", description: "Student submitted request." },
      { date: "13 August 2026, 3:00 PM", description: "Support team reviewed the request." },
    ],
  },
  {
    id: "SUP-2026-0031",
    category: "Login Problem",
    status: "resolved",
    submitted: "11 August 2026",
    description: "I was unable to sign in using my student credentials. The page showed an error message.",
    response: "Please try signing out and signing in again. If the issue continues, contact Election Administration.",
    timeline: [
      { date: "11 August 2026, 10:30 AM", description: "Student submitted request." },
      { date: "11 August 2026, 11:00 AM", description: "Support team reviewed the request." },
      { date: "11 August 2026, 2:00 PM", description: "Support response added." },
    ],
  },
  {
    id: "SUP-2026-0018",
    category: "Vote Receipt",
    status: "closed",
    submitted: "10 August 2026",
    description: "My receipt is not showing after I submitted my vote.",
    response: "Your receipt has been generated. Please refresh the receipt page.",
    timeline: [
      { date: "10 August 2026, 4:30 PM", description: "Student submitted request." },
      { date: "10 August 2026, 4:45 PM", description: "Support team reviewed the request." },
      { date: "10 August 2026, 5:00 PM", description: "Support response added." },
      { date: "10 August 2026, 5:30 PM", description: "Request closed." },
    ],
  },
];

export const FAQ_ITEMS = [
  {
    question: "Can I vote more than once?",
    answer: "No. Each eligible student can submit one ballot for the election.",
  },
  {
    question: "Can I change my vote after submission?",
    answer: "No. Review your ballot carefully before submitting.",
  },
  {
    question: "What should I do if I cannot log in?",
    answer: "Use the password recovery option. If the issue continues, submit a support request.",
  },
  {
    question: "My receipt is not showing. What should I do?",
    answer: "Refresh the receipt page. If the problem continues, submit a support request.",
  },
  {
    question: "Can I vote after the election closes?",
    answer: "No. Voting is available only during the published election period.",
  },
  {
    question: "Does my receipt show who I voted for?",
    answer: "No. The receipt confirms that a ballot was recorded but does not display candidate selections.",
  },
  {
    question: "Can I vote from my phone?",
    answer: "Yes. CampusVote is designed for desktop, tablet and mobile devices.",
  },
];

export const HELP_TOPICS = [
  {
    id: "how-to-vote",
    title: "How to Vote",
    description: "Learn how to cast and submit your vote.",
    content: "Sign in with your student account, review candidates, select one per position, review your ballot, and submit. A receipt is generated after successful submission.",
  },
  {
    id: "why-cant-i-vote",
    title: "Why Can't I Vote?",
    description: "Common reasons you may be unable to vote.",
    content: "You may not be eligible, the election may be closed, or you may have already submitted a ballot. Check your eligibility on the vote page.",
  },
  {
    id: "change-selection",
    title: "How Do I Change My Selection?",
    description: "Learn about changing candidate selections.",
    content: "You can change your selection while reviewing your ballot before submitting. After submission, votes cannot be changed.",
  },
  {
    id: "after-submit",
    title: "What Happens After I Submit?",
    description: "Understand what happens after vote submission.",
    content: "Your ballot is recorded and a receipt is generated. You cannot submit another ballot for the same election.",
  },
  {
    id: "find-receipt",
    title: "How Do I Find My Receipt?",
    description: "Locate your vote receipt.",
    content: "Go to My Receipt from the sidebar navigation. Your receipt shows the receipt ID, election name, and submission date.",
  },
  {
    id: "verify-receipt",
    title: "How Do I Verify My Receipt?",
    description: "Verify your receipt is valid.",
    content: "Use the receipt ID on the public verification page at /verify/[receiptId] or use the verification section on your receipt page.",
  },
  {
    id: "voting-closed",
    title: "Why Is Voting Closed?",
    description: "Understand voting availability.",
    content: "Voting is available only during the published election period. If the election has ended, you cannot submit a ballot.",
  },
  {
    id: "login-issue",
    title: "What if I Cannot Log In?",
    description: "Troubleshoot login issues.",
    content: "Check your credentials, try refreshing the page, or use the password recovery option. Submit a support request if the issue continues.",
  },
  {
    id: "session-expired",
    title: "What if My Session Expires?",
    description: "Handle session expiration.",
    content: "Sign in again with your student credentials. Your in-progress selections may not be saved.",
  },
  {
    id: "contact-admin",
    title: "How Do I Contact Election Administration?",
    description: "Reach election administrators.",
    content: "Use the Contact Administration section on the Help page for election-related questions.",
  },
];

export const SYSTEM_STATUS = [
  { name: "Voting System", status: "operational" as const },
  { name: "Authentication", status: "operational" as const },
  { name: "Receipt Verification", status: "operational" as const },
  { name: "Notifications", status: "operational" as const },
];

export const TROUBLESHOOTING = [
  {
    problem: "Login isn't working",
    steps: [
      "Check your email/student credentials.",
      "Check your internet connection.",
      "Try refreshing the page.",
      "Try signing in again.",
      "Contact support if the issue continues.",
    ],
  },
  {
    problem: "Voting page isn't loading",
    steps: [
      "Refresh the page.",
      "Check your internet connection.",
      "Sign out and sign in again.",
      "Try another supported browser.",
      "Contact support.",
    ],
  },
  {
    problem: "Receipt isn't showing",
    steps: [
      "Refresh the receipt page.",
      "Check My Receipts.",
      "Wait briefly if the receipt is still generating.",
      "Submit a support request if the issue continues.",
    ],
  },
];

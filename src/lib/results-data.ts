export interface CandidateResult {
  id: string;
  name: string;
  votes: number;
  percentage: number;
  rank: number;
  status: "winner" | "runner_up" | "other";
}

export interface PositionResult {
  position: string;
  totalVotes: number;
  abstained: number;
  candidates: CandidateResult[];
  isTie: boolean;
}

export interface ElectionResults {
  electionName: string;
  publishedDate: string;
  publishedBy: string;
  status: "not_published" | "published";
  eligibleStudents: number;
  ballotsSubmitted: number;
  participation: number;
  totalPositions: number;
  totalCandidates: number;
  positions: PositionResult[];
}

export interface DepartmentParticipation {
  department: string;
  eligible: number;
  participated: number;
  rate: number;
}

export interface ReportData {
  election: string;
  period: string;
  eligibleStudents: number;
  candidates: number;
  positions: number;
  ballotsSubmitted: number;
  participation: number;
  resultsStatus: string;
  publicationStatus: string;
}

export const MOCK_ELECTION_RESULTS: ElectionResults = {
  electionName: "Student Council Election 2026",
  publishedDate: "11 August 2026",
  publishedBy: "Election Administration",
  status: "published",
  eligibleStudents: 2846,
  ballotsSubmitted: 1742,
  participation: 61.2,
  totalPositions: 6,
  totalCandidates: 24,
  positions: [
    {
      position: "President",
      totalVotes: 1742,
      abstained: 48,
      isTie: false,
      candidates: [
        { id: "CAN-001", name: "Aarav Sharma", votes: 842, percentage: 48.3, rank: 1, status: "winner" },
        { id: "CAN-002", name: "Riya Mehta", votes: 631, percentage: 36.2, rank: 2, status: "runner_up" },
        { id: "CAN-010", name: "Kabir Singh", votes: 270, percentage: 15.5, rank: 3, status: "other" },
      ],
    },
    {
      position: "Vice President",
      totalVotes: 1698,
      abstained: 44,
      isTie: false,
      candidates: [
        { id: "CAN-003", name: "Rohit Verma", votes: 720, percentage: 42.4, rank: 1, status: "winner" },
        { id: "CAN-004", name: "Sneha Gupta", votes: 580, percentage: 34.2, rank: 2, status: "runner_up" },
        { id: "CAN-011", name: "Karan Patel", votes: 398, percentage: 23.4, rank: 3, status: "other" },
      ],
    },
    {
      position: "General Secretary",
      totalVotes: 1720,
      abstained: 22,
      isTie: false,
      candidates: [
        { id: "CAN-005", name: "Vikram Singh", votes: 690, percentage: 40.1, rank: 1, status: "winner" },
        { id: "CAN-006", name: "Ananya Desai", votes: 540, percentage: 31.4, rank: 2, status: "runner_up" },
        { id: "CAN-012", name: "Nisha Kapoor", votes: 490, percentage: 28.5, rank: 3, status: "other" },
      ],
    },
    {
      position: "Treasurer",
      totalVotes: 1710,
      abstained: 32,
      isTie: false,
      candidates: [
        { id: "CAN-007", name: "Arjun Mehta", votes: 810, percentage: 47.4, rank: 1, status: "winner" },
        { id: "CAN-013", name: "Priya Nair", votes: 520, percentage: 30.4, rank: 2, status: "runner_up" },
        { id: "CAN-014", name: "Amit Joshi", votes: 380, percentage: 22.2, rank: 3, status: "other" },
      ],
    },
    {
      position: "Cultural Secretary",
      totalVotes: 1690,
      abstained: 52,
      isTie: true,
      candidates: [
        { id: "CAN-008", name: "Kavya Nair", votes: 650, percentage: 38.5, rank: 1, status: "winner" },
        { id: "CAN-015", name: "Siddharth Rao", votes: 650, percentage: 38.5, rank: 1, status: "winner" },
        { id: "CAN-016", name: "Meera Iyer", votes: 390, percentage: 23.0, rank: 3, status: "other" },
      ],
    },
    {
      position: "Sports Secretary",
      totalVotes: 1705,
      abstained: 37,
      isTie: false,
      candidates: [
        { id: "CAN-017", name: "Aditya Rao", votes: 730, percentage: 42.8, rank: 1, status: "winner" },
        { id: "CAN-018", name: "Tanvi Bhat", votes: 560, percentage: 32.8, rank: 2, status: "runner_up" },
        { id: "CAN-019", name: "Rahul Das", votes: 415, percentage: 24.3, rank: 3, status: "other" },
      ],
    },
  ],
};

export const MOCK_DEPARTMENT_PARTICIPATION: DepartmentParticipation[] = [
  { department: "BCA", eligible: 800, participated: 512, rate: 64.0 },
  { department: "BBA", eligible: 620, participated: 367, rate: 59.2 },
  { department: "BSc IT", eligible: 540, participated: 338, rate: 62.6 },
  { department: "BCom", eligible: 480, participated: 283, rate: 59.0 },
  { department: "BA", eligible: 406, participated: 242, rate: 59.6 },
];

export const MOCK_ADMIN_REPORTS = {
  reportData: {
    election: "Student Council Election 2026",
    period: "1 – 10 August 2026",
    eligibleStudents: 2846,
    candidates: 24,
    positions: 6,
    ballotsSubmitted: 1742,
    participation: 61.2,
    resultsStatus: "Published",
    publicationStatus: "Official",
  } as ReportData,

  candidateReport: [
    { id: "CAN-001", name: "Aarav Sharma", position: "President", applicationStatus: "Approved", profileStatus: "Published", finalResult: "Winner" },
    { id: "CAN-002", name: "Riya Mehta", position: "President", applicationStatus: "Approved", profileStatus: "Published", finalResult: "Runner-up" },
    { id: "CAN-003", name: "Rohit Verma", position: "Vice President", applicationStatus: "Approved", profileStatus: "Published", finalResult: "Winner" },
    { id: "CAN-004", name: "Sneha Gupta", position: "Vice President", applicationStatus: "Approved", profileStatus: "Published", finalResult: "Runner-up" },
    { id: "CAN-005", name: "Vikram Singh", position: "General Secretary", applicationStatus: "Approved", profileStatus: "Published", finalResult: "Winner" },
    { id: "CAN-006", name: "Ananya Desai", position: "General Secretary", applicationStatus: "Approved", profileStatus: "Published", finalResult: "Runner-up" },
    { id: "CAN-007", name: "Arjun Mehta", position: "Treasurer", applicationStatus: "Approved", profileStatus: "Published", finalResult: "Winner" },
    { id: "CAN-008", name: "Kavya Nair", position: "Cultural Secretary", applicationStatus: "Approved", profileStatus: "Published", finalResult: "Winner (Tie)" },
  ],

  issueReport: {
    total: 42,
    open: 5,
    inReview: 8,
    resolved: 29,
    categories: [
      { name: "Technical", count: 15 },
      { name: "Login", count: 8 },
      { name: "Voting", count: 7 },
      { name: "Receipt", count: 5 },
      { name: "Candidate", count: 4 },
      { name: "Other", count: 3 },
    ],
  },

  activityReport: [
    { date: "13 Aug 2026", candidateApprovals: 2, announcements: 1, electionChanges: 0, issueResolutions: 3, resultPublications: 0 },
    { date: "12 Aug 2026", candidateApprovals: 1, announcements: 0, electionChanges: 1, issueResolutions: 2, resultPublications: 0 },
    { date: "11 Aug 2026", candidateApprovals: 0, announcements: 0, electionChanges: 1, issueResolutions: 1, resultPublications: 1 },
    { date: "10 Aug 2026", candidateApprovals: 3, announcements: 2, electionChanges: 0, issueResolutions: 4, resultPublications: 0 },
    { date: "09 Aug 2026", candidateApprovals: 1, announcements: 1, electionChanges: 0, issueResolutions: 2, resultPublications: 0 },
  ],

  positionReport: [
    { position: "President", candidates: 3, totalVotes: 1742, winner: "Aarav Sharma", winnerVotes: 842, participation: 61.2 },
    { position: "Vice President", candidates: 3, totalVotes: 1698, winner: "Rohit Verma", winnerVotes: 720, participation: 59.7 },
    { position: "General Secretary", candidates: 3, totalVotes: 1720, winner: "Vikram Singh", winnerVotes: 690, participation: 60.4 },
    { position: "Treasurer", candidates: 3, totalVotes: 1710, winner: "Arjun Mehta", winnerVotes: 810, participation: 60.1 },
    { position: "Cultural Secretary", candidates: 3, totalVotes: 1690, winner: "Kavya Nair / Siddharth Rao (Tie)", winnerVotes: 650, participation: 59.4 },
    { position: "Sports Secretary", candidates: 3, totalVotes: 1705, winner: "Aditya Rao", winnerVotes: 730, participation: 59.9 },
  ],
};

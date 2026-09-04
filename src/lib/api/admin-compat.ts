/**
 * Legacy type aliases kept so `@/lib/api` (the barrel file) keeps compiling
 * while `./admin` exposes the new real-data shapes. New code should import
 * from `@/lib/api/admin` directly.
 */
export type AdminElection = {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  eligibleStudents: number;
  totalPositions: number;
  participation: number;
};

export type AdminStudent = {
  id: string;
  name: string;
  email: string;
  department: string;
  year: string;
  section: string;
  hasVoted: boolean;
  status: string;
};

export type ScheduleEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  type: string;
  status: string;
};

export type Announcement = {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: string;
  status: string;
};

export type AdminIssue = {
  id: string;
  title: string;
  category: string;
  reportedBy: string;
  date: string;
  status: string;
  priority: string;
};

export type ActivityLogEntry = {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details: string;
};
